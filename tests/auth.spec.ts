import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { TEST_USERS, SELECTORS, TIMEOUTS } from '../fixtures/test-data';
import { loginWithCredentials, logout, ensureLoggedOut } from '../utils/helpers';

/**
 * AUTH-01 through AUTH-14
 * Login / Authentication test scenarios
 */

test.describe('Login / Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ─── AUTH-01: Successful login ──────────────────────────────────────────────
  test('AUTH-01 @smoke | Successful login with valid credentials', async ({ page }) => {
    await loginPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);

    await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible({ timeout: TIMEOUTS.medium });
    await expect(page).toHaveURL(/home|dashboard/);
  });

  // ─── AUTH-02: Wrong password ────────────────────────────────────────────────
  test('AUTH-02 | Login with invalid password', async () => {
    await loginPage.login(TEST_USERS.valid.email, 'WrongPassword!99');

    await loginPage.expectError('Incorrect password');
    await expect(loginPage.loginButton).toBeEnabled();
  });

  // ─── AUTH-03: Unregistered email ────────────────────────────────────────────
  test('AUTH-03 | Login with unregistered email', async () => {
    await loginPage.login(TEST_USERS.invalid.email, TEST_USERS.invalid.password);

    await loginPage.expectError('No account found with this email');
  });

  // ─── AUTH-04: Empty fields ──────────────────────────────────────────────────
  test('AUTH-04 @edge | Login with empty email and password fields', async ({ page }) => {
    // Attempt to login without filling fields
    await loginPage.loginButton.tap();

    // Validation errors should appear, no network request fired
    const emailError = page.locator('[data-testid="email-error"]');
    const passwordError = page.locator('[data-testid="password-error"]');
    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
    await expect(page).toHaveURL(/login/); // stays on login
  });

  // ─── AUTH-05: iOS button UI ─────────────────────────────────────────────────
  test('AUTH-05 @ui | Login button renders with Panthers branding on iOS', async ({ page }) => {
    // Run on iPhone projects only
    test.skip(
      !page.context().browser()?.browserType().name().includes('webkit'),
      'iOS-specific UI test'
    );
    await loginPage.expectLoginButtonStyle();
    await expect(loginPage.loginButton).toBeVisible();
    const box = await loginPage.loginButton.boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    expect(box?.height).toBeGreaterThan(44);
  });

  // ─── AUTH-06: Android button UI ────────────────────────────────────────────
  test('AUTH-06 @ui | Login button renders consistently on Android', async ({ page }) => {
    test.skip(
      !page.context().browser()?.browserType().name().includes('chromium'),
      'Android-specific UI test'
    );
    await loginPage.expectLoginButtonStyle();
    const box = await loginPage.loginButton.boundingBox();
    // Button should not overflow viewport
    const viewport = page.viewportSize();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  });

  // ─── AUTH-07: Apple Sign-In ─────────────────────────────────────────────────
  test('AUTH-07 @smoke | Social login via Apple ID', async ({ page }) => {
    await expect(loginPage.appleSignIn).toBeVisible();
    await loginPage.appleSignIn.tap();

    // Expect Apple OAuth redirect or native prompt
    // In test env, a mock OAuth callback resolves the flow
    await expect(page).toHaveURL(/home|dashboard|callback/, { timeout: TIMEOUTS.long });
    await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible();
  });

  // ─── AUTH-08: Google Sign-In ────────────────────────────────────────────────
  test('AUTH-08 @smoke | Social login via Google', async ({ page }) => {
    await expect(loginPage.googleSignIn).toBeVisible();
    await loginPage.googleSignIn.tap();

    await expect(page).toHaveURL(/home|dashboard|callback/, { timeout: TIMEOUTS.long });
    await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible();
  });

  // ─── AUTH-09: Forgot Password ───────────────────────────────────────────────
  test('AUTH-09 | Forgot Password flow sends reset email', async ({ page }) => {
    await loginPage.forgotPasswordLink.tap();
    await expect(page).toHaveURL(/forgot-password|reset/);

    await page.fill('[data-testid="reset-email"]', TEST_USERS.valid.email);
    await page.tap('[data-testid="send-reset"]');

    const successMsg = page.locator('[data-testid="reset-success"]');
    await expect(successMsg).toBeVisible();
    await expect(successMsg).toContainText(/email sent|check your inbox/i);
  });

  // ─── AUTH-10: Session persists after app close ──────────────────────────────
  test('AUTH-10 @smoke | Session persists after app is closed and reopened', async ({ page, context }) => {
    await loginWithCredentials(page);

    // Simulate "closing" app by opening new page in same context (same storage)
    const newPage = await context.newPage();
    await newPage.goto('/');

    await expect(newPage.locator(SELECTORS.auth.profileIcon)).toBeVisible({ timeout: TIMEOUTS.medium });
    await newPage.close();
  });

  // ─── AUTH-11: Logout clears session ────────────────────────────────────────
  test('AUTH-11 | Logout clears session and redirects to login', async ({ page, context }) => {
    await loginWithCredentials(page);
    await logout(page);

    // Open fresh page in same context — must show login
    const newPage = await context.newPage();
    await newPage.goto('/');
    await expect(newPage.locator(SELECTORS.auth.loginButton)).toBeVisible();
    await newPage.close();
  });

  // ─── AUTH-12: Special characters in password ────────────────────────────────
  test('AUTH-12 @edge | Login with special characters in password succeeds', async ({ page }) => {
    await loginPage.login(TEST_USERS.specialChars.email, TEST_USERS.specialChars.password);

    await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible({ timeout: TIMEOUTS.medium });
  });

  // ─── AUTH-13: Account lockout after repeated failures ───────────────────────
  test('AUTH-13 @edge | Multiple failed logins trigger lockout or CAPTCHA', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await loginPage.login(TEST_USERS.valid.email, 'WrongPassword');
      await expect(loginPage.errorMessage).toBeVisible();
      if (i < 4) {
        await page.reload();
        await loginPage.goto();
      }
    }

    // After 5 failures: lockout message or CAPTCHA must appear
    const lockout = page.locator('[data-testid="account-locked"], [data-testid="captcha-widget"]');
    await expect(lockout).toBeVisible({ timeout: TIMEOUTS.medium });
  });

  // ─── AUTH-14: Biometric login ───────────────────────────────────────────────
  test('AUTH-14 @smoke | Biometric login (Face ID / Fingerprint) authenticates user', async ({ page }) => {
    // Pre-condition: biometric is enabled in app settings (mocked in test env)
    await page.goto('/login?biometric=enabled');

    const biometricBtn = loginPage.biometricButton;
    await expect(biometricBtn).toBeVisible();
    await biometricBtn.tap();

    // Mock biometric success event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('biometric:success'));
    });

    await expect(page.locator(SELECTORS.auth.profileIcon)).toBeVisible({ timeout: TIMEOUTS.medium });
  });
});
