import { Page, expect } from '@playwright/test';
import { SELECTORS, TEST_USERS } from '../fixtures/test-data';

/**
 * Shared utility helpers for FanApp Gameday test suite.
 */

// ─── Auth Helpers ────────────────────────────────────────────────────────────

export async function loginWithCredentials(
  page: Page,
  email = TEST_USERS.valid.email,
  password = TEST_USERS.valid.password
): Promise<void> {
  await page.goto('/login');
  await page.fill(SELECTORS.auth.emailInput, email);
  await page.fill(SELECTORS.auth.passwordInput, password);
  await page.tap(SELECTORS.auth.loginButton);
  await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible({ timeout: 10_000 });
}

export async function logout(page: Page): Promise<void> {
  await page.tap(SELECTORS.auth.profileIcon);
  await page.tap(SELECTORS.auth.logoutButton);
  await expect(page.locator(SELECTORS.auth.loginButton)).toBeVisible();
}

export async function ensureLoggedOut(page: Page): Promise<void> {
  const isLoggedIn = await page.locator(SELECTORS.auth.profileIcon).isVisible();
  if (isLoggedIn) await logout(page);
}

// ─── Network Helpers ─────────────────────────────────────────────────────────

export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

export async function simulateSlowNetwork(page: Page): Promise<void> {
  await page.context().route('**/*', (route) => {
    setTimeout(() => route.continue(), 1500); // simulate 3G delay
  });
}

// ─── Cart / Food Helpers ──────────────────────────────────────────────────────

export async function navigateToFood(page: Page): Promise<void> {
  await page.tap(SELECTORS.nav.food);
  await expect(page.locator(SELECTORS.food.categoryList).first()).toBeVisible();
}

export async function addItemToCart(page: Page, itemName: string): Promise<void> {
  await page.locator(SELECTORS.food.menuItem).filter({ hasText: itemName }).tap();
  await page.tap(SELECTORS.food.addToCartBtn);
}

export async function getCartCount(page: Page): Promise<number> {
  const badge = await page.locator(SELECTORS.food.cartBadge).textContent();
  return parseInt(badge ?? '0', 10);
}

// ─── Ticket Helpers ───────────────────────────────────────────────────────────

export async function navigateToTickets(page: Page): Promise<void> {
  await page.tap(SELECTORS.nav.tickets);
  await expect(page.locator(SELECTORS.tickets.list)).toBeVisible();
}

export async function openFirstGame(page: Page): Promise<void> {
  await page.locator(SELECTORS.tickets.gameCard).first().tap();
}

export async function fillPaymentDetails(
  page: Page,
  card = '4111111111111111',
  expiry = '12/26',
  cvv = '123'
): Promise<void> {
  await page.fill(SELECTORS.tickets.paymentCardInput, card);
  await page.fill(SELECTORS.tickets.paymentExpiry, expiry);
  await page.fill(SELECTORS.tickets.paymentCVV, cvv);
}

// ─── Arena Helpers ────────────────────────────────────────────────────────────

export async function navigateToArena(page: Page): Promise<void> {
  await page.tap(SELECTORS.nav.arena);
  await expect(page.locator(SELECTORS.arena.mapContainer)).toBeVisible();
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

export async function expectToastOrError(page: Page, locator: string, messageFragment: string): Promise<void> {
  const el = page.locator(locator);
  await expect(el).toBeVisible();
  await expect(el).toContainText(messageFragment);
}

export async function expectButtonDisabled(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeDisabled();
}

export async function expectButtonEnabled(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeEnabled();
}

export async function swipeLeft(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element not found: ${selector}`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
}

export async function pinchZoom(page: Page, scale: number): Promise<void> {
  // Playwright doesn't natively support multi-touch pinch; use CDP if needed
  // This is a placeholder for native app WebDriver bridge
  await page.evaluate((s) => {
    window.dispatchEvent(new CustomEvent('app:pinch-zoom', { detail: { scale: s } }));
  }, scale);
}
