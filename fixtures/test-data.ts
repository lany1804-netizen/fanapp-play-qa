/**
 * Test fixtures & constants forFanAppQA tests.
 * Update values here to match your staging/test environment.
 */

export const TEST_USERS = {
  valid: {
    email: 'qa_tester@FanApp-test.com',
    password: 'Test@FanApp2024!',
    displayName: 'QA Tester',
  },
  invalid: {
    email: 'notregistered@fake.com',
    password: 'WrongPassword123',
  },
  specialChars: {
    email: 'qa_special@FanApp-test.com',
    password: 'P@$$w0rd!#%^&*()',
  },
  biometric: {
    email: 'qa_biometric@FanApp-test.com',
    password: 'Biometric@Test1!',
  },
};

export const PROMO_CODES = {
  valid: 'FanApp10',
  expired: 'EXPIRED2022',
  invalid: 'FAKECODE999',
};

export const GAME = {
  upcomingId: 'game-20240315',
  liveId: 'game-live-001',
  completedId: 'game-20240301',
  opponent: 'Boston Bruins',
  date: 'March 15, 2025',
  time: '7:00 PM ET',
};

export const SEATS = {
  available: { section: '112', row: 'C', seat: '14', price: '$89.00' },
  available2: { section: '112', row: 'C', seat: '15', price: '$89.00' },
  soldOut: { section: '101', row: 'A', seat: '1' },
  vip: { section: 'Club 1', row: 'B', seat: '5', price: '$299.00' },
};

export const FOOD = {
  item: { name: 'Loaded Nachos', price: '$14.00', category: 'Snacks' },
  drink: { name: 'Craft Beer', price: '$12.00', category: 'Drinks' },
  vegetarian: { name: 'Garden Burger', category: 'Entrees' },
  soldOut: { name: 'Seasonal Special', category: 'Entrees' },
  withModifier: { name: 'Hot Dog', modifier: 'No Onions' },
};

export const ARENA = {
  sections: ['112', '215', 'Club 1'],
  levels: ['Level 1 - Concourse', 'Level 2 - Club', 'Level 3 - Upper'],
};

export const TIMEOUTS = {
  short: 3_000,
  medium: 8_000,
  long: 15_000,
  pushNotification: 20_000,
  realTimeScore: 15_000,
};

export const SELECTORS = {
  // Bottom Navigation
  nav: {
    home: '[data-testid="nav-home"]',
    tickets: '[data-testid="nav-tickets"]',
    game: '[data-testid="nav-game"]',
    food: '[data-testid="nav-food"]',
    arena: '[data-testid="nav-arena"]',
  },
  // Auth
  auth: {
    emailInput: '[data-testid="login-email"]',
    passwordInput: '[data-testid="login-password"]',
    loginButton: '[data-testid="login-submit"]',
    forgotPassword: '[data-testid="forgot-password"]',
    appleSignIn: '[data-testid="apple-signin"]',
    googleSignIn: '[data-testid="google-signin"]',
    biometricButton: '[data-testid="biometric-login"]',
    errorMessage: '[data-testid="auth-error"]',
    logoutButton: '[data-testid="logout-btn"]',
    profileIcon: '[data-testid="profile-icon"]',
  },
  // Tickets
  tickets: {
    list: '[data-testid="ticket-list"]',
    gameCard: '[data-testid="game-card"]',
    buyTicketsBtn: '[data-testid="buy-tickets"]',
    seatMap: '[data-testid="seat-map"]',
    seatAvailable: '[data-testid^="seat-available-"]',
    seatSoldOut: '[data-testid^="seat-soldout-"]',
    selectedSeatInfo: '[data-testid="selected-seat-info"]',
    continueBtn: '[data-testid="checkout-continue"]',
    promoInput: '[data-testid="promo-code-input"]',
    applyPromoBtn: '[data-testid="apply-promo"]',
    promoError: '[data-testid="promo-error"]',
    promoSuccess: '[data-testid="promo-success"]',
    orderTotal: '[data-testid="order-total"]',
    paymentCardInput: '[data-testid="card-number"]',
    paymentExpiry: '[data-testid="card-expiry"]',
    paymentCVV: '[data-testid="card-cvv"]',
    confirmPurchaseBtn: '[data-testid="confirm-purchase"]',
    orderConfirmation: '[data-testid="order-confirmation"]',
    myTicketsList: '[data-testid="my-tickets-list"]',
    ticketBarcode: '[data-testid="ticket-barcode"]',
    transferBtn: '[data-testid="transfer-ticket"]',
    transferEmailInput: '[data-testid="transfer-email"]',
    transferConfirmBtn: '[data-testid="transfer-confirm"]',
    upgradeBtn: '[data-testid="upgrade-seat"]',
  },
  // Scores
  scores: {
    liveScore: '[data-testid="live-score"]',
    homeTeamScore: '[data-testid="home-score"]',
    awayTeamScore: '[data-testid="away-score"]',
    period: '[data-testid="current-period"]',
    clock: '[data-testid="game-clock"]',
    playByPlay: '[data-testid="play-by-play"]',
    statsTab: '[data-testid="stats-tab"]',
    shotsOnGoal: '[data-testid="shots-on-goal"]',
    offlineBanner: '[data-testid="offline-banner"]',
    gameStatus: '[data-testid="game-status"]',
    countdownTimer: '[data-testid="countdown-timer"]',
  },
  // Food
  food: {
    orderTab: '[data-testid="nav-food"]',
    categoryList: '[data-testid="food-category"]',
    menuItem: '[data-testid^="menu-item-"]',
    addToCartBtn: '[data-testid="add-to-cart"]',
    cartBadge: '[data-testid="cart-badge"]',
    cartIcon: '[data-testid="cart-icon"]',
    cartItem: '[data-testid="cart-item"]',
    qtyIncrease: '[data-testid="qty-increase"]',
    qtyDecrease: '[data-testid="qty-decrease"]',
    removeItem: '[data-testid="remove-item"]',
    cartTotal: '[data-testid="cart-total"]',
    deliveryOption: '[data-testid="delivery-seat"]',
    pickupOption: '[data-testid="delivery-pickup"]',
    seatNumberInput: '[data-testid="seat-number-input"]',
    pickupStandSelect: '[data-testid="pickup-stand"]',
    checkoutBtn: '[data-testid="food-checkout"]',
    orderConfirmation: '[data-testid="food-order-confirmation"]',
    estimatedTime: '[data-testid="estimated-time"]',
    orderStatus: '[data-testid="order-status"]',
    trackOrderBtn: '[data-testid="track-order"]',
    dietaryFilter: '[data-testid="dietary-filter"]',
    soldOutLabel: '[data-testid="sold-out-label"]',
    modifierToggle: '[data-testid^="modifier-"]',
    unavailableMessage: '[data-testid="ordering-unavailable"]',
    emptyCartMessage: '[data-testid="empty-cart-message"]',
  },
  // Arena
  arena: {
    mapContainer: '[data-testid="arena-map"]',
    findSeatBtn: '[data-testid="find-my-seat"]',
    amenityFilter: '[data-testid^="filter-"]',
    restroomFilter: '[data-testid="filter-restrooms"]',
    concessionsFilter: '[data-testid="filter-concessions"]',
    firstAidFilter: '[data-testid="filter-firstaid"]',
    vipFilter: '[data-testid="filter-vip"]',
    accessibleRouteToggle: '[data-testid="accessible-route"]',
    levelSelector: '[data-testid^="level-btn-"]',
    mapSearchInput: '[data-testid="map-search"]',
    highlightedSection: '[data-testid="highlighted-section"]',
    highlightedRoute: '[data-testid="highlighted-route"]',
    offlineIndicator: '[data-testid="map-offline"]',
    locationPrompt: '[data-testid="location-prompt"]',
    amenityMarker: '[data-testid^="amenity-marker-"]',
    gateMarker: '[data-testid^="gate-marker-"]',
  },
};
