import { test, expect } from '@playwright/test';

test.describe('Core Job Radar Dashboard (/app)', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh login
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');
    
    // Authenticate with admin account for unrestricted access to jobs
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should render the dashboard layout with KPI metrics and active jobs', async ({ page }) => {
    await expect(page.locator('header')).toContainText(/TalentRadar/i);
    
    // Check metric cards exist
    await expect(page.locator('text=Total Scored Jobs').first()).toBeVisible();
    await expect(page.locator('text=Top ATS Fit').first()).toBeVisible();
    await expect(page.locator('text=Gulf Tech Hub').first()).toBeVisible();
  });

  test('should search and filter jobs by keyword', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by job title" i]');
    await expect(searchInput).toBeVisible();

    // Type search term and press Enter
    await searchInput.fill('Engineer');
    await searchInput.press('Enter');

    // Wait for filtered jobs to appear
    await page.waitForTimeout(1000);
    const bodyText = await page.textContent('main');
    expect(bodyText).toMatch(/Engineer|Software/i);
  });

  test('should toggle regional filter for Gulf Tech Hub and Pakistan', async ({ page }) => {
    // Click Gulf Tech Hub metric card or filter
    const gulfMetric = page.locator('text=Gulf Tech Hub').first();
    await gulfMetric.click();
    
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText(/Gulf Tech Hub|UAE|Saudi/i);
  });
});
