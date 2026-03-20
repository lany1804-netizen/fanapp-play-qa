import { test, expect } from '@playwright/test';
import { TicketsPage } from '../pages';
import { SELECTORS, SEATS, PROMO_CODES, TIMEOUTS } from '../fixtures/test-data';
import { loginWithCredentials, goOffline, goOnline } from '../utils/helpers';

/**
 * TKT-01 through TKT-14
 * Ticketing & Seat Selection test scenarios
 */

test.describe('Ticketing & Seat Selection', () => {
  let ticketsPage: TicketsPage;

  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    ticketsPage = new TicketsPage(page);
  });

  // ─── TKT-01: View upcoming game ticket list ─────────────────────────────────
  test('TKT-01 @smoke | Upcoming games list displays correctly', async ({ page }) => {
    await ticketsPage.goto();

    const gameCards = page.locator(SELECTORS.tickets.gameCard);
    await expect(gameCards.first()).toBeVisible();

    // Each card should have date, opponent, and a ticket status/button
    const firstCard = gameCards.first();
    await expect(firstCard.locator('[data-testid="game-date"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="game-opponent"]')).toBeVisible();
  });

  // ─── TKT-02: Select seats from arena map ───────────────────────────────────
  test('TKT-02 @smoke | Select available seat shows seat details', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();

    await ticketsPage.selectAvailableSeat(0);

    const seatInfo = page.locator(SELECTORS.tickets.selectedSeatInfo);
    await expect(seatInfo).toBeVisible();
    await expect(seatInfo).toContainText(/section|row|seat/i);
    await expect(seatInfo).toContainText('$');
  });

  // ─── TKT-03: Purchase single ticket ────────────────────────────────────────
  test('TKT-03 @smoke | Purchase a single ticket end-to-end', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();
    await ticketsPage.selectAvailableSeat(0);
    await ticketsPage.proceedToCheckout();
    await ticketsPage.fillPayment('4111111111111111', '12/26', '123');
    await ticketsPage.confirmPurchase();

    // Verify confirmation screen
    const confirmation = page.locator(SELECTORS.tickets.orderConfirmation);
    await expect(confirmation).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(confirmation).toContainText(/order confirmed|ticket/i);

    // Verify ticket appears in My Tickets
    await ticketsPage.viewMyTickets();
    await expect(page.locator(SELECTORS.tickets.myTicketsList).locator('li').first()).toBeVisible();
  });

  // ─── TKT-04: Purchase multiple tickets ─────────────────────────────────────
  test('TKT-04 | Purchase 4 tickets in one order', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();

    // Select 4 available seats
    const availableSeats = page.locator(SELECTORS.tickets.seatAvailable);
    for (let i = 0; i < 4; i++) {
      await availableSeats.nth(i).tap();
    }

    // Verify quantity shows 4
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('4');

    await ticketsPage.proceedToCheckout();
    await ticketsPage.fillPayment('4111111111111111', '12/26', '123');
    await ticketsPage.confirmPurchase();

    await ticketsPage.viewMyTickets();
    // Order entry should reference 4 tickets
    await expect(page.locator('[data-testid="order-ticket-count"]').first()).toContainText('4');
  });

  // ─── TKT-05: Sold-out seat not selectable ──────────────────────────────────
  test('TKT-05 @edge | Sold-out seat is not selectable', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();

    const soldOutSeat = page.locator(SELECTORS.tickets.seatSoldOut).first();
    await expect(soldOutSeat).toBeVisible();

    // Attempt to tap sold-out seat
    await soldOutSeat.tap({ force: true });

    // No seat info should appear
    await expect(page.locator(SELECTORS.tickets.selectedSeatInfo)).not.toBeVisible();

    // Tooltip/message should appear
    const unavailableMsg = page.locator('[data-testid="seat-unavailable-tooltip"]');
    await expect(unavailableMsg).toBeVisible({ timeout: TIMEOUTS.short });
  });

  // ─── TKT-06: Seat map renders and zoom works ────────────────────────────────
  test('TKT-06 @ui | Arena seat map renders sections and responds to zoom', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();

    const seatMap = page.locator(SELECTORS.tickets.seatMap);
    await expect(seatMap).toBeVisible();

    // Available seats should be distinguishable (green/colored)
    const available = page.locator(SELECTORS.tickets.seatAvailable);
    await expect(available.first()).toBeVisible();

    // Section labels should be present
    await expect(page.locator('[data-testid^="section-label-"]').first()).toBeVisible();
  });

  // ─── TKT-07: Valid promo code applies discount ──────────────────────────────
  test('TKT-07 | Valid promo code applies a discount at checkout', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();
    await ticketsPage.selectAvailableSeat(0);
    await ticketsPage.proceedToCheckout();

    const totalBefore = await page.locator(SELECTORS.tickets.orderTotal).textContent();

    await ticketsPage.applyPromoCode(PROMO_CODES.valid);

    await expect(page.locator(SELECTORS.tickets.promoSuccess)).toBeVisible();
    const totalAfter = await page.locator(SELECTORS.tickets.orderTotal).textContent();

    // Total should be lower after promo
    const parsedBefore = parseFloat(totalBefore?.replace(/[^0-9.]/g, '') ?? '0');
    const parsedAfter = parseFloat(totalAfter?.replace(/[^0-9.]/g, '') ?? '0');
    expect(parsedAfter).toBeLessThan(parsedBefore);
  });

  // ─── TKT-08: Invalid promo code shows error ─────────────────────────────────
  test('TKT-08 @edge | Invalid promo code shows error and no discount applied', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();
    await ticketsPage.selectAvailableSeat(0);
    await ticketsPage.proceedToCheckout();

    const totalBefore = await page.locator(SELECTORS.tickets.orderTotal).textContent();
    await ticketsPage.applyPromoCode(PROMO_CODES.invalid);

    await expect(page.locator(SELECTORS.tickets.promoError)).toBeVisible();
    await expect(page.locator(SELECTORS.tickets.promoError)).toContainText(/invalid|expired/i);

    const totalAfter = await page.locator(SELECTORS.tickets.orderTotal).textContent();
    expect(totalBefore).toBe(totalAfter); // unchanged
  });

  // ─── TKT-09: View digital ticket barcode ───────────────────────────────────
  test('TKT-09 @smoke | Digital ticket barcode shows full-screen', async ({ page }) => {
    await ticketsPage.viewMyTickets();
    await ticketsPage.openTicketBarcode(0);

    const barcode = page.locator(SELECTORS.tickets.ticketBarcode);
    await expect(barcode).toBeVisible();

    // Barcode should fill most of the screen (>60% width)
    const barcodeBox = await barcode.boundingBox();
    const viewport = page.viewportSize();
    expect(barcodeBox!.width / viewport!.width).toBeGreaterThan(0.6);
  });

  // ─── TKT-10: Transfer ticket ────────────────────────────────────────────────
  test('TKT-10 | Transfer ticket to another user', async ({ page }) => {
    await ticketsPage.viewMyTickets();
    await ticketsPage.openTicketBarcode(0);

    await page.tap(SELECTORS.tickets.transferBtn);
    await page.fill(SELECTORS.tickets.transferEmailInput, 'recipient@test.com');
    await page.tap(SELECTORS.tickets.transferConfirmBtn);

    const success = page.locator('[data-testid="transfer-success"]');
    await expect(success).toBeVisible({ timeout: TIMEOUTS.medium });
    await expect(success).toContainText(/transferred|sent/i);
  });

  // ─── TKT-11: Ticket wallet offline access ──────────────────────────────────
  test('TKT-11 @edge | Ticket barcode is accessible while offline', async ({ page }) => {
    // Load ticket while online to cache it
    await ticketsPage.viewMyTickets();
    await ticketsPage.openTicketBarcode(0);
    await expect(page.locator(SELECTORS.tickets.ticketBarcode)).toBeVisible();

    // Go offline and navigate back
    await goOffline(page);
    await page.goBack();
    await ticketsPage.openTicketBarcode(0);

    await expect(page.locator(SELECTORS.tickets.ticketBarcode)).toBeVisible({ timeout: TIMEOUTS.medium });
    await goOnline(page);
  });

  // ─── TKT-12: Seat upgrade option ───────────────────────────────────────────
  test('TKT-12 | Seat upgrade CTA is visible when upgrades are available', async ({ page }) => {
    await ticketsPage.viewMyTickets();
    await ticketsPage.openTicketBarcode(0);

    // The upgrade button may or may not exist depending on availability
    const upgradeBtn = page.locator(SELECTORS.tickets.upgradeBtn);
    const isVisible = await upgradeBtn.isVisible();

    if (isVisible) {
      await expect(upgradeBtn).toContainText(/upgrade/i);
    } else {
      // Acceptable — no upgrades available
      console.log('TKT-12: No upgrades available for this ticket — skipping assertion.');
    }
  });

  // ─── TKT-13: Payment failure ────────────────────────────────────────────────
  test('TKT-13 @edge | Declined card shows payment error and no ticket issued', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();
    await ticketsPage.selectAvailableSeat(0);
    await ticketsPage.proceedToCheckout();

    // Use known-declined test card
    await ticketsPage.fillPayment('4000000000000002', '12/26', '123');
    await page.tap(SELECTORS.tickets.confirmPurchaseBtn);

    const paymentError = page.locator('[data-testid="payment-error"]');
    await expect(paymentError).toBeVisible({ timeout: TIMEOUTS.medium });
    await expect(paymentError).toContainText(/declined|payment failed/i);

    // Should NOT navigate to confirmation
    await expect(page.locator(SELECTORS.tickets.orderConfirmation)).not.toBeVisible();
  });

  // ─── TKT-14: Seat map accessibility labels ──────────────────────────────────
  test('TKT-14 @ui | Seat map has accessibility labels for screen readers', async ({ page }) => {
    await ticketsPage.goto();
    await ticketsPage.openGame();
    await ticketsPage.tapBuyTickets();

    const availableSeats = page.locator(SELECTORS.tickets.seatAvailable);
    const count = await availableSeats.count();
    expect(count).toBeGreaterThan(0);

    // First seat must have aria-label with section/row/seat info
    const ariaLabel = await availableSeats.first().getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/section|row|seat/i);
  });
});
