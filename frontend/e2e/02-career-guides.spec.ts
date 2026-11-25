import { test, expect } from '@playwright/test';

test.describe('Public career guides (/guides)', () => {
  test('lists the guides', async ({ page }) => {
    await page.goto('/guides');
    await expect(page).toHaveTitle(/Guides/i);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /The 2026 ATS Resume Checklist/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /How to Write a Resume Summary/i }).first()).toBeVisible();
  });

  test('a guide renders its sections and a short page title', async ({ page }) => {
    await page.goto('/guides/resume-bullet-points-xyz-formula');
    await expect(page.locator('h1')).toContainText(/X-Y-Z/i);
    expect((await page.title()).length).toBeLessThanOrEqual(65);
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Open Free Resume Builder/i })).toBeVisible();
  });

  test('unknown guide shows the custom 404 page', async ({ page }) => {
    const res = await page.goto('/guides/does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /could not find that page/i })).toBeVisible();
  });
});
