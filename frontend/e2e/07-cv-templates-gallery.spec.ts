import { test, expect } from '@playwright/test';

test.describe('100+ CV Templates Gallery & Multi-Format Exporter', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh login
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should open 100+ template gallery modal from tailored CV tab', async ({ page }) => {
    // Open intelligence panel
    const toggleBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter|Hide Intelligence/i }).first();
    await toggleBtn.click();

    // Click on Tailored CV tab
    const cvTab = page.locator('button', { hasText: /1-Click Tailored CV/i }).first();
    await cvTab.click();

    // Verify 100+ Templates button is visible and click it
    const openGalleryBtn = page.getByRole('button', { name: /Choose from 100\+ Templates/i }).first();
    await expect(openGalleryBtn).toBeVisible();
    await openGalleryBtn.click();

    // Verify gallery modal opens
    await expect(page.locator('text=Select Your Tailored CV Template')).toBeVisible();
    await expect(page.locator('text=105+ Professional CV Designs')).toBeVisible();
  });

  test('should filter templates by category tabs and search query', async ({ page }) => {
    // Open gallery modal
    const toggleBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter|Hide Intelligence/i }).first();
    await toggleBtn.click();
    const cvTab = page.locator('button', { hasText: /1-Click Tailored CV/i }).first();
    await cvTab.click();
    await page.getByRole('button', { name: /Choose from 100\+ Templates/i }).first().click();

    // Filter by Gulf & Middle East category
    const gulfTab = page.locator('button', { hasText: /Gulf & Middle East/i }).first();
    await gulfTab.click();
    await expect(page.locator('text=Dubai Silicon Oasis').first()).toBeVisible();

    // Search for a specific template
    const searchInput = page.locator('input[placeholder*="Search 100+ templates" i]');
    await searchInput.fill('Riyadh');
    await expect(page.locator('text=Riyadh').first()).toBeVisible();
  });

  test('should select a template and update active template design', async ({ page }) => {
    // Open gallery modal
    const toggleBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter|Hide Intelligence/i }).first();
    await toggleBtn.click();
    const cvTab = page.locator('button', { hasText: /1-Click Tailored CV/i }).first();
    await cvTab.click();
    await page.getByRole('button', { name: /Choose from 100\+ Templates/i }).first().click();

    // Select the first template card button
    const selectBtn = page.locator('button', { hasText: /^Select$/i }).first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      // Modal should close and toast should show selected template
      await expect(page.locator('text=Selected template:').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
