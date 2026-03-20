import { test, expect } from '@playwright/test';
import { ArenaNavigationPage } from '../pages';
import { SELECTORS, ARENA, TIMEOUTS } from '../fixtures/test-data';
import { loginWithCredentials, goOffline, goOnline } from '../utils/helpers';

/**
 * NAV-01 through NAV-14
 * Arena Navigation / Wayfinding test scenarios
 */

test.describe('Arena Navigation / Wayfinding', () => {
  let arenaPage: ArenaNavigationPage;

  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    arenaPage = new ArenaNavigationPage(page);
    await arenaPage.goto();
  });

  // ─── NAV-01: View arena map ─────────────────────────────────────────────────
  test('NAV-01 @smoke | Arena map renders with sections, gates, and amenities labeled', async ({ page }) => {
    const map = page.locator(SELECTORS.arena.mapContainer);
    await expect(map).toBeVisible();

    // Sections should be labeled
    await expect(page.locator('[data-testid^="section-label-"]').first()).toBeVisible();

    // Gate markers visible
    await expect(page.locator(SELECTORS.arena.gateMarker).first()).toBeVisible();
  });

  // ─── NAV-02: Navigate to user's seat ───────────────────────────────────────
  test('NAV-02 @smoke | Find My Seat highlights route from current position to seat', async ({ page }) => {
    await page.tap(SELECTORS.arena.findSeatBtn);

    const route = page.locator(SELECTORS.arena.highlightedRoute);
    await expect(route).toBeVisible({ timeout: TIMEOUTS.medium });

    // Destination section should be highlighted
    await expect(page.locator(SELECTORS.arena.highlightedSection)).toBeVisible();
  });

  // ─── NAV-03: Find nearest restroom ─────────────────────────────────────────
  test('NAV-03 | Restroom filter highlights nearest restroom locations', async ({ page }) => {
    await arenaPage.applyFilter('restrooms');

    const restroomMarkers = page.locator('[data-testid^="amenity-marker-restroom"]');
    await expect(restroomMarkers.first()).toBeVisible({ timeout: TIMEOUTS.medium });

    const count = await restroomMarkers.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ─── NAV-04: Find nearest concession stand ──────────────────────────────────
  test('NAV-04 | Concessions filter shows all nearby stand locations', async ({ page }) => {
    await arenaPage.applyFilter('concessions');

    const standMarkers = page.locator('[data-testid^="amenity-marker-concession"]');
    await expect(standMarkers.first()).toBeVisible({ timeout: TIMEOUTS.medium });

    const count = await standMarkers.count();
    expect(count).toBeGreaterThanOrEqual(2); // Multiple stands expected
  });

  // ─── NAV-05: Find first aid station ────────────────────────────────────────
  test('NAV-05 | First Aid filter shows medical station locations', async ({ page }) => {
    await arenaPage.applyFilter('firstaid');

    const medMarkers = page.locator('[data-testid^="amenity-marker-firstaid"]');
    await expect(medMarkers.first()).toBeVisible({ timeout: TIMEOUTS.medium });

    // First aid icon should have distinct styling (typically red cross)
    const icon = medMarkers.first().locator('[data-testid="firstaid-icon"]');
    await expect(icon).toBeVisible();
  });

  // ─── NAV-06: Arena map zoom and pan ────────────────────────────────────────
  test('NAV-06 @ui | Arena map supports zoom and pan gestures smoothly', async ({ page }) => {
    const mapContainer = page.locator(SELECTORS.arena.mapContainer);
    await expect(mapContainer).toBeVisible();

    // Simulate zoom in
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app:pinch-zoom', { detail: { scale: 2.0 } }));
    });
    await page.waitForTimeout(500);

    // Section labels should still be readable (not hidden)
    await expect(page.locator('[data-testid^="section-label-"]').first()).toBeVisible();

    // Simulate zoom out
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app:pinch-zoom', { detail: { scale: 0.8 } }));
    });
    await page.waitForTimeout(300);

    // Map should still render without error
    await expect(mapContainer).toBeVisible();
  });

  // ─── NAV-07: Switch between floor levels ────────────────────────────────────
  test('NAV-07 | Switching floor levels updates the map display', async ({ page }) => {
    // Start on Level 1
    await arenaPage.switchLevel(1);
    const level1Label = await page.locator('[data-testid="current-level-label"]').textContent();
    expect(level1Label).toMatch(/1|Concourse/i);

    // Switch to Level 2
    await arenaPage.switchLevel(2);
    const level2Label = await page.locator('[data-testid="current-level-label"]').textContent();
    expect(level2Label).toMatch(/2|Club/i);

    expect(level1Label).not.toBe(level2Label);
  });

  // ─── NAV-08: Map loads without GPS permission ───────────────────────────────
  test('NAV-08 @edge | Map loads and shows location prompt when GPS is denied', async ({ page, context }) => {
    // Deny geolocation permission
    await context.grantPermissions([]); // revoke permissions

    await page.goto('/arena');

    const mapContainer = page.locator(SELECTORS.arena.mapContainer);
    await expect(mapContainer).toBeVisible({ timeout: TIMEOUTS.medium }); // No crash

    const locationPrompt = page.locator(SELECTORS.arena.locationPrompt);
    await expect(locationPrompt).toBeVisible();
    await expect(locationPrompt).toContainText(/enable location|location access/i);
  });

  // ─── NAV-09: ADA accessible route ──────────────────────────────────────────
  test('NAV-09 | Accessible route toggle avoids stairs and uses elevators/ramps', async ({ page }) => {
    await page.tap(SELECTORS.arena.findSeatBtn);
    await arenaPage.toggleAccessibleRoute();

    const accessibleToggle = page.locator(SELECTORS.arena.accessibleRouteToggle);
    await expect(accessibleToggle).toBeChecked();

    // Route should contain only accessible waypoints (no stair markers)
    const stairMarkers = page.locator('[data-testid^="waypoint-stairs"]');
    await expect(stairMarkers).toHaveCount(0);

    // Elevator or ramp markers should appear on the route
    const accessibleWaypoints = page.locator('[data-testid^="waypoint-elevator"], [data-testid^="waypoint-ramp"]');
    await expect(accessibleWaypoints.first()).toBeVisible();
  });

  // ─── NAV-10: Gate entry points on map ──────────────────────────────────────
  test('NAV-10 | All public entry gates are labeled and marked on the map', async ({ page }) => {
    const gateMarkers = page.locator(SELECTORS.arena.gateMarker);
    await expect(gateMarkers.first()).toBeVisible();

    const count = await gateMarkers.count();
    expect(count).toBeGreaterThanOrEqual(3); // Amerant Bank Arena has multiple gate entries

    // Each gate marker should have a readable label
    const firstLabel = await gateMarkers.first().getAttribute('aria-label');
    expect(firstLabel).toMatch(/gate|entrance/i);
  });

  // ─── NAV-11: Map on tablet ─────────────────────────────────────────────────
  test('NAV-11 @ui | Arena map takes full advantage of tablet screen', async ({ page }) => {
    const viewport = page.viewportSize();

    // This test is meaningful only on tablet
    if (!viewport || viewport.width < 768) {
      test.skip(true, 'This test is tablet-specific');
    }

    const map = page.locator(SELECTORS.arena.mapContainer);
    const box = await map.boundingBox();
    expect(box).not.toBeNull();

    // Map should fill ≥ 80% of the screen width
    expect(box!.width / viewport!.width).toBeGreaterThan(0.8);

    // No overflow clipping
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  });

  // ─── NAV-12: Search for a section ──────────────────────────────────────────
  test('NAV-12 | Section search highlights and centers the map on that section', async ({ page }) => {
    await arenaPage.searchSection('112');

    const highlighted = page.locator(SELECTORS.arena.highlightedSection);
    await expect(highlighted).toBeVisible({ timeout: TIMEOUTS.medium });

    // Section label should contain "112"
    await expect(highlighted).toContainText('112');
  });

  // ─── NAV-13: Map offline behavior ──────────────────────────────────────────
  test('NAV-13 @edge | Cached arena map remains functional while offline', async ({ page }) => {
    // Load map while connected to allow caching
    await expect(page.locator(SELECTORS.arena.mapContainer)).toBeVisible();
    await expect(page.locator('[data-testid^="section-label-"]').first()).toBeVisible();

    // Go offline
    await goOffline(page);
    await page.waitForTimeout(800);

    // Offline indicator should appear
    const offlineIndicator = page.locator(SELECTORS.arena.offlineIndicator);
    await expect(offlineIndicator).toBeVisible({ timeout: TIMEOUTS.medium });

    // Map content should still be visible (from cache)
    await expect(page.locator(SELECTORS.arena.mapContainer)).toBeVisible();
    await expect(page.locator('[data-testid^="section-label-"]').first()).toBeVisible();

    // Restore connection
    await goOnline(page);
    await expect(offlineIndicator).not.toBeVisible({ timeout: TIMEOUTS.medium });
  });

  // ─── NAV-14: VIP lounge locations ──────────────────────────────────────────
  test('NAV-14 | VIP filter reveals club lounge and premium area markers', async ({ page }) => {
    await arenaPage.applyFilter('vip');

    const vipMarkers = page.locator('[data-testid^="amenity-marker-vip"]');
    await expect(vipMarkers.first()).toBeVisible({ timeout: TIMEOUTS.medium });

    const count = await vipMarkers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // VIP markers should have distinct icons (crown or star)
    const vipIcon = vipMarkers.first().locator('[data-testid="vip-icon"]');
    await expect(vipIcon).toBeVisible();
  });
});
