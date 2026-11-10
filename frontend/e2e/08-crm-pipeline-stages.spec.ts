import { test, expect } from '@playwright/test';

test.describe('CRM Pipeline Stages & Job Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh login
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should allow changing a job pipeline stage from dropdown', async ({ page }) => {
    // Select the stage dropdown of the first job card
    const stageSelect = page.locator('select').first();
    await expect(stageSelect).toBeVisible();

    // Change to 'applied' stage
    await stageSelect.selectOption('applied');

    // Verify confirmation toast appears
    await expect(page.locator('text=Stage updated to APPLIED').first()).toBeVisible({ timeout: 5000 });
  });

  test('should submit company feedback thumbs up/down', async ({ page }) => {
    const thumbsUpBtn = page.locator('button[title="Boost this company in market scans"]').first();
    await thumbsUpBtn.click();

    // Verify AI feedback toast
    await expect(page.locator('text=AI tuned with your preference!').first()).toBeVisible({ timeout: 5000 });
  });
});
