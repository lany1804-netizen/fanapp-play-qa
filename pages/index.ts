import { Page, expect, Locator } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';

// ─── Login Page ───────────────────────────────────────────────────────────────

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly appleSignIn: Locator;
  readonly googleSignIn: Locator;
  readonly biometricButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator(SELECTORS.auth.emailInput);
    this.passwordInput = page.locator(SELECTORS.auth.passwordInput);
    this.loginButton = page.locator(SELECTORS.auth.loginButton);
    this.errorMessage = page.locator(SELECTORS.auth.errorMessage);
    this.forgotPasswordLink = page.locator(SELECTORS.auth.forgotPassword);
    this.appleSignIn = page.locator(SELECTORS.auth.appleSignIn);
    this.googleSignIn = page.locator(SELECTORS.auth.googleSignIn);
    this.biometricButton = page.locator(SELECTORS.auth.biometricButton);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.loginButton).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.tap();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginButtonStyle(): Promise<void> {
    const bg = await this.loginButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    //FanAppQA red ~rgb(178, 34, 34)
    expect(bg).toMatch(/178|B22222/i);
  }
}

// ─── Tickets Page ─────────────────────────────────────────────────────────────

export class TicketsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.tap(SELECTORS.nav.tickets);
    await expect(this.page.locator(SELECTORS.tickets.list)).toBeVisible();
  }

  async openGame(index = 0): Promise<void> {
    await this.page.locator(SELECTORS.tickets.gameCard).nth(index).tap();
  }

  async tapBuyTickets(): Promise<void> {
    await this.page.tap(SELECTORS.tickets.buyTicketsBtn);
    await expect(this.page.locator(SELECTORS.tickets.seatMap)).toBeVisible();
  }

  async selectAvailableSeat(index = 0): Promise<void> {
    await this.page.locator(SELECTORS.tickets.seatAvailable).nth(index).tap();
    await expect(this.page.locator(SELECTORS.tickets.selectedSeatInfo)).toBeVisible();
  }

  async proceedToCheckout(): Promise<void> {
    await this.page.tap(SELECTORS.tickets.continueBtn);
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.page.fill(SELECTORS.tickets.promoInput, code);
    await this.page.tap(SELECTORS.tickets.applyPromoBtn);
  }

  async fillPayment(card: string, expiry: string, cvv: string): Promise<void> {
    await this.page.fill(SELECTORS.tickets.paymentCardInput, card);
    await this.page.fill(SELECTORS.tickets.paymentExpiry, expiry);
    await this.page.fill(SELECTORS.tickets.paymentCVV, cvv);
  }

  async confirmPurchase(): Promise<void> {
    await this.page.tap(SELECTORS.tickets.confirmPurchaseBtn);
    await expect(this.page.locator(SELECTORS.tickets.orderConfirmation)).toBeVisible({ timeout: 15_000 });
  }

  async viewMyTickets(): Promise<void> {
    await this.page.goto('/tickets/my-tickets');
  }

  async openTicketBarcode(index = 0): Promise<void> {
    await this.page.locator(SELECTORS.tickets.myTicketsList).locator('li').nth(index).tap();
    await expect(this.page.locator(SELECTORS.tickets.ticketBarcode)).toBeVisible();
  }
}

// ─── Game Score Page ──────────────────────────────────────────────────────────

export class GameScorePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.tap(SELECTORS.nav.game);
    await expect(this.page.locator(SELECTORS.scores.liveScore)).toBeVisible();
  }

  async getHomeScore(): Promise<string> {
    return (await this.page.locator(SELECTORS.scores.homeTeamScore).textContent()) ?? '';
  }

  async getAwayScore(): Promise<string> {
    return (await this.page.locator(SELECTORS.scores.awayTeamScore).textContent()) ?? '';
  }

  async openStatsTab(): Promise<void> {
    await this.page.tap(SELECTORS.scores.statsTab);
    await expect(this.page.locator(SELECTORS.scores.shotsOnGoal)).toBeVisible();
  }
}

// ─── Food Order Page ──────────────────────────────────────────────────────────

export class FoodOrderPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.tap(SELECTORS.nav.food);
    await expect(this.page.locator(SELECTORS.food.categoryList).first()).toBeVisible();
  }

  async addItemByName(name: string): Promise<void> {
    await this.page.locator(SELECTORS.food.menuItem).filter({ hasText: name }).tap();
    await this.page.tap(SELECTORS.food.addToCartBtn);
  }

  async openCart(): Promise<void> {
    await this.page.tap(SELECTORS.food.cartIcon);
    await expect(this.page.locator(SELECTORS.food.cartItem).first()).toBeVisible();
  }

  async getCartTotal(): Promise<string> {
    return (await this.page.locator(SELECTORS.food.cartTotal).textContent()) ?? '';
  }

  async checkout(): Promise<void> {
    await this.page.tap(SELECTORS.food.checkoutBtn);
  }

  async selectDelivery(): Promise<void> {
    await this.page.tap(SELECTORS.food.deliveryOption);
  }

  async selectPickup(): Promise<void> {
    await this.page.tap(SELECTORS.food.pickupOption);
  }
}

// ─── Arena Navigation Page ────────────────────────────────────────────────────

export class ArenaNavigationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.tap(SELECTORS.nav.arena);
    await expect(this.page.locator(SELECTORS.arena.mapContainer)).toBeVisible();
  }

  async applyFilter(filter: string): Promise<void> {
    await this.page.tap(`[data-testid="filter-${filter}"]`);
  }

  async switchLevel(level: number): Promise<void> {
    await this.page.tap(`[data-testid="level-btn-${level}"]`);
  }

  async searchSection(query: string): Promise<void> {
    await this.page.fill(SELECTORS.arena.mapSearchInput, query);
    await this.page.keyboard.press('Enter');
  }

  async toggleAccessibleRoute(): Promise<void> {
    await this.page.tap(SELECTORS.arena.accessibleRouteToggle);
  }
}
