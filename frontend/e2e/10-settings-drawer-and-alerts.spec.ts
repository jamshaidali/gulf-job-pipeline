import { test, expect } from '@playwright/test';

test.describe('Settings Drawer & Automated Alerts Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure clean session
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should open settings drawer from header button', async ({ page }) => {
    const settingsBtn = page.locator('button[title*="Settings" i]').first();
    await settingsBtn.click();

    // Verify Settings Drawer is visible
    const drawer = page.locator('div[role="dialog"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=Career Profile & AI Intelligence Settings')).toBeVisible();
    await expect(drawer.locator('text=Personal & Goals')).toBeVisible();
  });

  test('should switch between Settings tabs: Stack, Experience, and Alerts', async ({ page }) => {
    const settingsBtn = page.locator('button[title*="Settings" i]').first();
    await settingsBtn.click();

    const drawer = page.locator('div[role="dialog"]');
    await expect(drawer).toBeVisible();

    // 1. Switch to Tech Stack tab inside drawer
    const stackTab = drawer.locator('button', { hasText: /Tech Stack/i });
    await stackTab.click();
    await expect(drawer.locator('text=Permanent Tech Stack')).toBeVisible();

    // 2. Switch to Alerts tab inside drawer
    const alertsTab = drawer.locator('button', { hasText: /Alerts/i });
    await alertsTab.click();
    await expect(drawer.locator('text=Email Alerts for High-Match Roles')).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Send Test Alert Email/i })).toBeVisible();
  });

  test('should add a new skill to primary stack and save preferences', async ({ page }) => {
    const settingsBtn = page.locator('button[title*="Settings" i]').first();
    await settingsBtn.click();

    const drawer = page.locator('div[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Switch to Tech Stack tab inside drawer
    await drawer.locator('button', { hasText: /Tech Stack/i }).click();

    // Add a unique test skill tag
    const skillInput = drawer.locator('input[placeholder*="FastAPI" i]');
    await skillInput.fill('Playwright-E2E');
    
    // Press Enter to add tag
    await skillInput.press('Enter');

    // Verify tag appeared inside drawer
    await expect(drawer.locator('text=Playwright-E2E')).toBeVisible();

    // Click Save button
    const saveBtn = drawer.getByRole('button', { name: /Save Profile/i });
    await saveBtn.click();

    // Verify confirmation toast
    await expect(page.locator('text=Career Profile & Alert preferences saved').first()).toBeVisible({ timeout: 6000 });
  });
});
