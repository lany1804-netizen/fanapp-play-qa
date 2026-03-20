# 🏒FanAppQA — Playwright Test Suite

Automated end-to-end tests for theFanAppQA Gameday mobile app (iOS & Android), built with [Playwright](https://playwright.dev/).

---

## 📁 Project Structure

```
FanApp-playwright/
├── tests/
│   ├── auth.spec.ts              # AUTH-01 to AUTH-14: Login & Authentication
│   ├── tickets.spec.ts           # TKT-01 to TKT-14: Ticketing & Seat Selection
│   ├── live-scores.spec.ts       # SCR-01 to SCR-12: Live Scores & Game Updates
│   ├── food-ordering.spec.ts     # FOOD-01 to FOOD-14: Food / Concessions
│   └── arena-navigation.spec.ts  # NAV-01 to NAV-14: Arena Navigation
├── pages/
│   └── index.ts                  # Page Object Models (POM)
├── fixtures/
│   └── test-data.ts              # Test data, selectors, constants
├── utils/
│   └── helpers.ts                # Shared utility functions
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json                 # TypeScript config
└── package.json
```

---

## 🧪 Test Coverage

| Module                    | Scenarios | Test IDs          |
|---------------------------|-----------|-------------------|
| Login / Authentication    | 14        | AUTH-01 – AUTH-14 |
| Ticketing & Seat Selection| 14        | TKT-01  – TKT-14  |
| Live Scores & Game Updates| 12        | SCR-01  – SCR-12  |
| Food / Concessions        | 14        | FOOD-01 – FOOD-14 |
| Arena Navigation          | 14        | NAV-01  – NAV-14  |
| **Total**                 | **68**    |                   |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+

### Install dependencies

```bash
npm install
npx playwright install
```

### Set environment variables

Create a `.env` file in the project root:

```env
BASE_URL=https://gameday-staging.FanAppQAFanApp.com
```

---

## ▶️ Running Tests

### Run all tests
```bash
npm test
```

### Run a specific module
```bash
npm run test:auth
npm run test:tickets
npm run test:scores
npm run test:food
npm run test:nav
```

### Run by tag
```bash
npm run test:smoke     # Critical path tests only
npm run test:ui        # UI/visual tests
npm run test:edge      # Edge case & error handling tests
```

### Run in headed mode (see the browser)
```bash
npm run test:headed
```

### Run on a specific device
```bash
npx playwright test --project="iPhone 14"
npx playwright test --project="Pixel 7"
npx playwright test --project="iPad Pro"
```

### Generate and view HTML report
```bash
npm run test:report
```

---

## 📱 Device Targets

| Project     | OS      | Viewport    |
|-------------|---------|-------------|
| iPhone 14   | iOS     | 390 × 844   |
| iPhone SE   | iOS     | 375 × 667   |
| Pixel 7     | Android | 412 × 915   |
| Galaxy S23  | Android | 360 × 780   |
| iPad Pro    | iPadOS  | 1024 × 1366 |

---

## 🏷️ Test Tags

Tests are tagged for filtered execution:

| Tag      | Description                              |
|----------|------------------------------------------|
| `@smoke` | Critical-path tests — run on every build |
| `@ui`    | UI/visual layout and style tests         |
| `@edge`  | Edge cases, error handling, offline tests|

---

## 🔧 Configuration

All configuration is in `playwright.config.ts`:

- **Base URL**: set via `BASE_URL` env var (defaults to production)
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: captured on failure
- **Video**: retained on failure
- **Traces**: captured on first retry

---

## 📝 Updating Test Data

Edit `fixtures/test-data.ts` to update:

- **`TEST_USERS`** — test account credentials
- **`PROMO_CODES`** — valid/invalid/expired codes
- **`FOOD`** — menu item names (must match staging menu)
- **`SELECTORS`** — `data-testid` attributes for all elements
- **`TIMEOUTS`** — timing constants per environment speed

> ⚠️ Selectors use `data-testid` attributes. Work with your dev team to ensure these are present on all interactive elements in the app.

---

## 🤝 CI/CD Integration

### GitHub Actions example

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🛠️ Adding New Tests

1. Add scenario to the appropriate `tests/*.spec.ts` file
2. Add any new selectors to `fixtures/test-data.ts`
3. Add reusable helpers to `utils/helpers.ts`
4. Tag the test with `@smoke`, `@ui`, or `@edge` as appropriate
5. Run the test locally before committing

---

## 📞 Contacts

| Role             | Contact                |
|------------------|------------------------|
| QA Lead          | qa-lead@FanApp.com   |
| Dev Contact      | dev-team@FanApp.com  |
| Playwright Docs  | https://playwright.dev |
