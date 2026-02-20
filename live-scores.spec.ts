import { test, expect } from '@playwright/test';
import { GameScorePage } from '../pages';
import { SELECTORS, TIMEOUTS } from '../fixtures/test-data';
import { loginWithCredentials, goOffline, goOnline } from '../utils/helpers';

/**
 * SCR-01 through SCR-12
 * Live Scores & Game Updates test scenarios
 */

test.describe('Live Scores & Game Updates', () => {
  let scorePage: GameScorePage;

  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    scorePage = new GameScorePage(page);
  });

  // ─── SCR-01: View live score during game ────────────────────────────────────
  test('SCR-01 @smoke | Live score displays period, clock, and both team scores', async ({ page }) => {
    // Point to a mock/seeded live game
    await page.goto('/game/live-test');
    await scorePage.goto();

    await expect(page.locator(SELECTORS.scores.homeTeamScore)).toBeVisible();
    await expect(page.locator(SELECTORS.scores.awayTeamScore)).toBeVisible();
    await expect(page.locator(SELECTORS.scores.period)).toBeVisible();
    await expect(page.locator(SELECTORS.scores.clock)).toBeVisible();

    // Scores should be numeric
    const homeScore = await scorePage.getHomeScore();
    expect(homeScore).toMatch(/^\d+$/);
  });

  // ─── SCR-02: Score updates in real-time ─────────────────────────────────────
  test('SCR-02 | Score updates within 10 seconds without manual refresh', async ({ page }) => {
    await page.goto('/game/live-test');

    const initialHome = await page.locator(SELECTORS.scores.homeTeamScore).textContent();

    // Trigger a simulated goal via test API/mock
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws:goal', { detail: { team: 'home', score: 1 } }));
    });

    await expect(async () => {
      const updatedHome = await page.locator(SELECTORS.scores.homeTeamScore).textContent();
      expect(updatedHome).not.toBe(initialHome);
    }).toPass({ timeout: TIMEOUTS.realTimeScore });
  });

  // ─── SCR-03: Goal push notification ─────────────────────────────────────────
  test('SCR-03 | Goal push notification sent within 15s of Panthers goal', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    await page.goto('/settings/notifications');
    await page.tap('[data-testid="enable-goal-notifications"]');

    // Background the app (navigate away)
    await page.goto('/home');

    // Simulate Panthers goal
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws:panthers-goal', { detail: { period: '2', time: '10:23' } }));
    });

    // Check notification was dispatched (app-level mock)
    await expect(async () => {
      const notifSent = await page.evaluate(() =>
        (window as any).__lastNotification?.title?.includes('Panthers') ?? false
      );
      expect(notifSent).toBe(true);
    }).toPass({ timeout: TIMEOUTS.pushNotification });
  });

  // ─── SCR-04: Play-by-play feed ──────────────────────────────────────────────
  test('SCR-04 | Play-by-play feed shows chronological game events', async ({ page }) => {
    await page.goto('/game/live-test');

    const pbpFeed = page.locator(SELECTORS.scores.playByPlay);
    await expect(pbpFeed).toBeVisible();

    const events = pbpFeed.locator('[data-testid="pbp-event"]');
    const count = await events.count();
    expect(count).toBeGreaterThan(0);

    // Each event should have a timestamp
    const firstTimestamp = await events.first().locator('[data-testid="pbp-time"]').textContent();
    expect(firstTimestamp).toMatch(/\d+:\d+|\d+[P]/);
  });

  // ─── SCR-05: Period stats tab ───────────────────────────────────────────────
  test('SCR-05 | Stats tab shows shots on goal, power plays, faceoffs', async ({ page }) => {
    await page.goto('/game/live-test');
    await scorePage.openStatsTab();

    await expect(page.locator(SELECTORS.scores.shotsOnGoal)).toBeVisible();
    await expect(page.locator('[data-testid="power-plays"]')).toBeVisible();
    await expect(page.locator('[data-testid="faceoff-pct"]')).toBeVisible();
    await expect(page.locator('[data-testid="penalties"]')).toBeVisible();
  });

  // ─── SCR-06: Score display on small screen (iPhone SE) ──────────────────────
  test('SCR-06 @ui | Score UI is not truncated on small screen (iPhone SE)', async ({ page }) => {
    await page.goto('/game/live-test');

    const viewport = page.viewportSize();
    // iPhone SE is 375x667
    expect(viewport?.width).toBeLessThanOrEqual(390);

    const homeScore = page.locator(SELECTORS.scores.homeTeamScore);
    const awayScore = page.locator(SELECTORS.scores.awayTeamScore);
    const clock = page.locator(SELECTORS.scores.clock);

    // All elements must be fully in viewport (not clipped)
    for (const el of [homeScore, awayScore, clock]) {
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    }
  });

  // ─── SCR-07: Scheduled game before it starts ───────────────────────────────
  test('SCR-07 | Upcoming game shows matchup info and countdown timer', async ({ page }) => {
    await page.goto('/game/upcoming-test');

    await expect(page.locator(SELECTORS.scores.countdownTimer)).toBeVisible();

    // Score placeholders should show '--' not a number
    const homeScore = await page.locator(SELECTORS.scores.homeTeamScore).textContent();
    const awayScore = await page.locator(SELECTORS.scores.awayTeamScore).textContent();
    expect(homeScore).toMatch(/^-+$/);
    expect(awayScore).toMatch(/^-+$/);
  });

  // ─── SCR-08: Completed game shows "Final" label ─────────────────────────────
  test('SCR-08 | Completed game shows final score with "Final" status', async ({ page }) => {
    await page.goto('/game/completed-test');

    const status = page.locator(SELECTORS.scores.gameStatus);
    await expect(status).toBeVisible();
    await expect(status).toContainText(/final/i);

    // Scores should be real numbers
    const home = await page.locator(SELECTORS.scores.homeTeamScore).textContent();
    const away = await page.locator(SELECTORS.scores.awayTeamScore).textContent();
    expect(parseInt(home ?? '-1')).toBeGreaterThanOrEqual(0);
    expect(parseInt(away ?? '-1')).toBeGreaterThanOrEqual(0);
  });

  // ─── SCR-09: Offline banner shown with cached score ─────────────────────────
  test('SCR-09 @edge | Offline state shows banner and last known score', async ({ page }) => {
    await page.goto('/game/live-test');

    // Ensure score loads first
    await expect(page.locator(SELECTORS.scores.homeTeamScore)).toBeVisible();
    const cachedScore = await page.locator(SELECTORS.scores.homeTeamScore).textContent();

    await goOffline(page);
    await page.waitForTimeout(1000);

    // Offline banner must appear
    await expect(page.locator(SELECTORS.scores.offlineBanner)).toBeVisible({ timeout: TIMEOUTS.medium });

    // Score should still display (cached)
    const offlineScore = await page.locator(SELECTORS.scores.homeTeamScore).textContent();
    expect(offlineScore).toBe(cachedScore);

    // Come back online — banner should disappear
    await goOnline(page);
    await expect(page.locator(SELECTORS.scores.offlineBanner)).not.toBeVisible({ timeout: TIMEOUTS.medium });
  });

  // ─── SCR-10: Overtime game score update ─────────────────────────────────────
  test('SCR-10 @edge | OT game shows OT period and F/OT on completion', async ({ page }) => {
    await page.goto('/game/ot-test');

    // During OT
    await expect(page.locator(SELECTORS.scores.period)).toContainText('OT');

    // Simulate OT game end
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws:game-end', { detail: { type: 'OT' } }));
    });

    await expect(page.locator(SELECTORS.scores.gameStatus)).toContainText(/F\/OT|Final OT/i, {
      timeout: TIMEOUTS.medium,
    });
  });

  // ─── SCR-11: Shootout score display ─────────────────────────────────────────
  test('SCR-11 @edge | Shootout shows shooter results and F/SO on completion', async ({ page }) => {
    await page.goto('/game/shootout-test');

    await expect(page.locator(SELECTORS.scores.period)).toContainText(/SO|Shootout/i);

    const shooterResults = page.locator('[data-testid="shootout-result"]');
    await expect(shooterResults.first()).toBeVisible();

    // Simulate shootout end
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws:game-end', { detail: { type: 'SO' } }));
    });

    await expect(page.locator(SELECTORS.scores.gameStatus)).toContainText(/F\/SO|Final SO/i, {
      timeout: TIMEOUTS.medium,
    });
  });

  // ─── SCR-12: Disable goal notifications ─────────────────────────────────────
  test('SCR-12 | Disabling goal notifications prevents push alerts', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    // Disable notifications
    await page.goto('/settings/notifications');
    const toggle = page.locator('[data-testid="enable-goal-notifications"]');
    const isOn = await toggle.isChecked();
    if (isOn) await toggle.tap();

    // Verify toggle is now off
    await expect(toggle).not.toBeChecked();

    // Trigger a goal
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws:panthers-goal', { detail: { period: '3', time: '5:00' } }));
    });

    await page.waitForTimeout(3000);

    // No notification should have been dispatched
    const notifSent = await page.evaluate(() =>
      (window as any).__lastNotification !== undefined
    );
    expect(notifSent).toBe(false);
  });
});
