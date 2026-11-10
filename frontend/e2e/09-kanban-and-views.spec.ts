import { test, expect } from '@playwright/test';

test.describe('CRM Kanban Pipeline Board & View Toggles', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure clean session
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should switch from list view to kanban board view', async ({ page }) => {
    // Find Kanban toggle button in view switcher
    const kanbanBtn = page.getByRole('button', { name: /Kanban Pipeline CRM/i }).first();
    await expect(kanbanBtn).toBeVisible();
    await kanbanBtn.click();

    // Verify all 5 pipeline columns render
    await expect(page.locator('text=Discovered').first()).toBeVisible();
    await expect(page.locator('text=Saved').first()).toBeVisible();
    await expect(page.locator('text=Applied').first()).toBeVisible();
    await expect(page.locator('text=Interviewing').first()).toBeVisible();
    await expect(page.locator('text=Offers').first()).toBeVisible();
  });

  test('should render job cards inside kanban columns', async ({ page }) => {
    const kanbanBtn = page.getByRole('button', { name: /Kanban Pipeline CRM/i }).first();
    await kanbanBtn.click();

    // Verify at least one job card exists across columns
    const cards = page.locator('div[class*="rounded-xl"]').filter({ hasText: /Match|Apply|⚡|⭐/i });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch back to live feed list view', async ({ page }) => {
    // First switch to kanban
    await page.getByRole('button', { name: /Kanban Pipeline CRM/i }).first().click();
    await expect(page.locator('text=Discovered').first()).toBeVisible();

    // Switch back to list view via view switcher
    const listBtn = page.getByRole('button', { name: /List View/i }).first();
    await expect(listBtn).toBeVisible();
    await listBtn.click();

    // Verify list view returns (e.g. Search Jobs or Total Scored Jobs metric)
    await expect(page.locator('text=Total Scored Jobs').first()).toBeVisible();
  });
});
