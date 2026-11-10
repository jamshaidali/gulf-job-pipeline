import { test, expect } from '@playwright/test';

test.describe('Authentication & User Onboarding Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh state
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');
  });

  test('should display login form with validation', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/TalentRadar/i);
    await expect(page.locator('h2')).toContainText(/Welcome back/i);
    
    // Check form inputs
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.getByRole('button', { name: /sign in/i });

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('should show error banner when entering invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('nonexistent_user_999');
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify error banner appears
    await expect(page.locator('text=Invalid username').first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow a new user to register and auto-redirect to /app', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText(/Create your account/i);

    const uniqueId = Date.now().toString().slice(-6);
    const testUsername = `usr_${uniqueId}`;
    const testEmail = `usr_${uniqueId}@example.com`;

    // Fill registration form using exact placeholders
    await page.locator('input[placeholder*="Jamshaid Ali" i]').fill(`Test User ${uniqueId}`);
    await page.locator('input[placeholder*="jamshaid_dev" i]').fill(testUsername);
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('SecureTestPass123!');

    await page.getByRole('button', { name: /get started free|create account/i }).click();

    // Should successfully redirect to application dashboard /app
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
    // Verify dashboard displays user or welcome banner
    await expect(page.locator('body')).toContainText(/TalentRadar/i);
  });
});
