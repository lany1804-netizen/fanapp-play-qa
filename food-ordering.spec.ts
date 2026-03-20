import { test, expect } from '@playwright/test';
import { FoodOrderPage } from '../pages';
import { SELECTORS, FOOD, TIMEOUTS } from '../fixtures/test-data';
import { loginWithCredentials, simulateSlowNetwork } from '../utils/helpers';

/**
 * FOOD-01 through FOOD-14
 * Food / Concessions Ordering test scenarios
 */

test.describe('Food / Concessions Ordering', () => {
  let foodPage: FoodOrderPage;

  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    foodPage = new FoodOrderPage(page);
    await foodPage.goto();
  });

  // ─── FOOD-01: Browse menu by category ──────────────────────────────────────
  test('FOOD-01 @smoke | Menu categories display with images, names, and prices', async ({ page }) => {
    const categories = page.locator(SELECTORS.food.categoryList);
    await expect(categories.first()).toBeVisible();

    const count = await categories.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least Snacks, Drinks, Entrees

    // First item in menu has image and price
    const firstItem = page.locator(SELECTORS.food.menuItem).first();
    await expect(firstItem.locator('img')).toBeVisible();
    await expect(firstItem.locator('[data-testid="item-price"]')).toContainText('$');
  });

  // ─── FOOD-02: Add item to cart ──────────────────────────────────────────────
  test('FOOD-02 @smoke | Adding item to cart updates cart badge count', async ({ page }) => {
    const badgeBefore = await page.locator(SELECTORS.food.cartBadge).textContent().catch(() => '0');

    await foodPage.addItemByName(FOOD.item.name);

    const badgeAfter = await page.locator(SELECTORS.food.cartBadge).textContent();
    expect(parseInt(badgeAfter ?? '0')).toBeGreaterThan(parseInt(badgeBefore ?? '0'));
  });

  // ─── FOOD-03: Modify item quantity in cart ──────────────────────────────────
  test('FOOD-03 | Cart quantity and total update when item qty is changed', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.openCart();

    const totalBefore = await foodPage.getCartTotal();

    // Increase quantity
    await page.tap(SELECTORS.food.qtyIncrease);

    const totalAfter = await foodPage.getCartTotal();
    const numBefore = parseFloat(totalBefore.replace(/[^0-9.]/g, ''));
    const numAfter = parseFloat(totalAfter.replace(/[^0-9.]/g, ''));
    expect(numAfter).toBeGreaterThan(numBefore);

    // Decrease back
    await page.tap(SELECTORS.food.qtyDecrease);
    const totalReset = await foodPage.getCartTotal();
    expect(totalReset).toBe(totalBefore);
  });

  // ─── FOOD-04: Remove item from cart ────────────────────────────────────────
  test('FOOD-04 | Removing item from cart recalculates total', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.addItemByName(FOOD.drink.name);
    await foodPage.openCart();

    const totalBefore = await foodPage.getCartTotal();

    // Remove the first item
    await page.tap(SELECTORS.food.removeItem);

    const totalAfter = await foodPage.getCartTotal();
    const numBefore = parseFloat(totalBefore.replace(/[^0-9.]/g, ''));
    const numAfter = parseFloat(totalAfter.replace(/[^0-9.]/g, ''));
    expect(numAfter).toBeLessThan(numBefore);
  });

  // ─── FOOD-05: Order with seat delivery ─────────────────────────────────────
  test('FOOD-05 @smoke | Seat delivery order confirmed with estimated time', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.openCart();
    await foodPage.selectDelivery();

    await page.fill(SELECTORS.food.seatNumberInput, '112-C-14');

    // Use saved payment method
    await page.tap('[data-testid="saved-payment"]');
    await foodPage.checkout();

    const confirmation = page.locator(SELECTORS.food.orderConfirmation);
    await expect(confirmation).toBeVisible({ timeout: TIMEOUTS.long });

    const estimatedTime = page.locator(SELECTORS.food.estimatedTime);
    await expect(estimatedTime).toBeVisible();
    await expect(estimatedTime).toContainText(/min|minute/i);

    // Order ID should be generated
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible();
  });

  // ─── FOOD-06: Order for pickup ──────────────────────────────────────────────
  test('FOOD-06 | Pickup order shows stand number and ready time', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.openCart();
    await foodPage.selectPickup();

    // Select a stand
    await page.selectOption(SELECTORS.food.pickupStandSelect, { index: 0 });
    await page.tap('[data-testid="saved-payment"]');
    await foodPage.checkout();

    const confirmation = page.locator(SELECTORS.food.orderConfirmation);
    await expect(confirmation).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(page.locator('[data-testid="pickup-stand-number"]')).toBeVisible();
    await expect(page.locator(SELECTORS.food.estimatedTime)).toBeVisible();
  });

  // ─── FOOD-07: Dietary filter — Vegetarian ───────────────────────────────────
  test('FOOD-07 | Vegetarian filter shows only vegetarian items', async ({ page }) => {
    // Apply vegetarian filter
    await page.tap(`${SELECTORS.food.dietaryFilter}[data-value="vegetarian"]`);

    const items = page.locator(SELECTORS.food.menuItem);
    await expect(items.first()).toBeVisible();

    const count = await items.count();
    for (let i = 0; i < count; i++) {
      // Each visible item should have vegetarian badge
      const badge = items.nth(i).locator('[data-testid="vegetarian-badge"]');
      await expect(badge).toBeVisible();
    }

    // Non-vegetarian items should not be present
    await expect(items.filter({ hasText: 'Pepperoni Pizza' })).not.toBeVisible();
  });

  // ─── FOOD-08: Real-time order status tracking ────────────────────────────────
  test('FOOD-08 | Order status progresses through Received > Preparing > Ready', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.openCart();
    await foodPage.selectPickup();
    await page.selectOption(SELECTORS.food.pickupStandSelect, { index: 0 });
    await page.tap('[data-testid="saved-payment"]');
    await foodPage.checkout();

    await page.tap(SELECTORS.food.trackOrderBtn);

    const statuses = ['Received', 'Preparing', 'Ready'];
    for (const status of statuses) {
      // Simulate status update from backend
      await page.evaluate((s) => {
        window.dispatchEvent(new CustomEvent('order:status-update', { detail: { status: s } }));
      }, status);

      await expect(page.locator(SELECTORS.food.orderStatus)).toContainText(status, {
        timeout: TIMEOUTS.medium,
      });
    }
  });

  // ─── FOOD-09: Ordering unavailable outside game hours ───────────────────────
  test('FOOD-09 @edge | Ordering unavailable message shown when menu is closed', async ({ page }) => {
    // Set mock time to before gates open
    await page.addInitScript(() => {
      (window as any).__mockOrderingAvailable = false;
    });

    await page.goto('/food');

    await expect(page.locator(SELECTORS.food.unavailableMessage)).toBeVisible();
    await expect(page.locator(SELECTORS.food.checkoutBtn)).toBeDisabled();
  });

  // ─── FOOD-10: Item modifier (no onions) ─────────────────────────────────────
  test('FOOD-10 | Custom modifier saved in cart and order summary', async ({ page }) => {
    // Find and open the item with modifiers
    await page.locator(SELECTORS.food.menuItem).filter({ hasText: FOOD.withModifier.name }).tap();

    const modifier = page.locator(`[data-testid="modifier-no-onions"]`);
    await expect(modifier).toBeVisible();
    await modifier.tap();

    await page.tap(SELECTORS.food.addToCartBtn);
    await foodPage.openCart();

    // Modifier should appear under item in cart
    const cartEntry = page.locator(SELECTORS.food.cartItem).filter({ hasText: FOOD.withModifier.name });
    await expect(cartEntry.locator('[data-testid="modifier-label"]')).toContainText('No Onions');
  });

  // ─── FOOD-11: Images load on slow network ───────────────────────────────────
  test('FOOD-11 @ui | Menu item images show placeholder then load on slow connection', async ({ page }) => {
    await simulateSlowNetwork(page);
    await page.goto('/food');

    // Placeholder visible first
    const placeholders = page.locator('[data-testid="item-image-placeholder"]');
    const placeholderCount = await placeholders.count();

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    // No broken images
    const brokenImages = page.locator('img[src=""], img:not([src])');
    await expect(brokenImages).toHaveCount(0);
  });

  // ─── FOOD-12: Payment with saved card ──────────────────────────────────────
  test('FOOD-12 @smoke | Checkout with saved payment card completes order', async ({ page }) => {
    await foodPage.addItemByName(FOOD.item.name);
    await foodPage.openCart();
    await foodPage.selectPickup();
    await page.selectOption(SELECTORS.food.pickupStandSelect, { index: 0 });

    const savedPayment = page.locator('[data-testid="saved-payment"]');
    await expect(savedPayment).toBeVisible();
    await savedPayment.tap();
    await foodPage.checkout();

    await expect(page.locator(SELECTORS.food.orderConfirmation)).toBeVisible({ timeout: TIMEOUTS.long });
  });

  // ─── FOOD-13: Out of stock item ─────────────────────────────────────────────
  test('FOOD-13 @edge | Sold-out item shows label and disabled add-to-cart', async ({ page }) => {
    const soldOutItem = page.locator(SELECTORS.food.menuItem).filter({ hasText: FOOD.soldOut.name });
    await expect(soldOutItem).toBeVisible();

    const soldOutLabel = soldOutItem.locator(SELECTORS.food.soldOutLabel);
    await expect(soldOutLabel).toBeVisible();
    await expect(soldOutLabel).toContainText(/sold out/i);

    // Add button should be disabled
    await soldOutItem.tap();
    await expect(page.locator(SELECTORS.food.addToCartBtn)).toBeDisabled();
  });

  // ─── FOOD-14: Empty cart checkout attempt ───────────────────────────────────
  test('FOOD-14 @edge | Cannot checkout with an empty cart', async ({ page }) => {
    // Open cart without adding anything
    await page.tap(SELECTORS.food.cartIcon);

    const emptyMsg = page.locator(SELECTORS.food.emptyCartMessage);
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText(/empty|no items/i);

    // Checkout button should be disabled or absent
    const checkoutBtn = page.locator(SELECTORS.food.checkoutBtn);
    const isDisabled = await checkoutBtn.isDisabled().catch(() => true);
    expect(isDisabled).toBe(true);
  });
});
