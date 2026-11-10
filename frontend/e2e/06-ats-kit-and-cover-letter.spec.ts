import { test, expect } from '@playwright/test';

test.describe('ATS Intelligence, Cover Letter, and Recruiter Reach', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh login
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should expand deep intelligence panel and view ATS keywords & bullets', async ({ page }) => {
    // Locate the first job card intelligence toggle button
    const toggleBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter|Hide Intelligence/i }).first();
    await toggleBtn.click();

    // Verify sub-tabs appear
    await expect(page.locator('button', { hasText: /ATS Keywords & Tailored Bullets/i }).first()).toBeVisible();
    await expect(page.locator('text=Recommended CV Accomplishment Bullets for this Role').first()).toBeVisible();
  });

  test('should generate and display AI-tailored cover letter', async ({ page }) => {
    // Open intelligence panel
    const toggleBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter|Hide Intelligence/i }).first();
    await toggleBtn.click();

    // Switch to Cover Letter tab
    const coverLetterTab = page.locator('button', { hasText: /AI Cover Letter/i }).first();
    await coverLetterTab.click();

    // Verify cover letter container appears
    await expect(page.locator('text=AI-Tailored Cover Letter').first()).toBeVisible();
    await expect(page.locator('button', { hasText: /Copy Cover Letter/i }).first()).toBeVisible();
  });

  test('should open recruiter outreach modal with 300-char LinkedIn note', async ({ page }) => {
    // Click Reach Recruiter button
    const recruiterBtn = page.getByRole('button', { name: /Reach Recruiter/i }).first();
    await recruiterBtn.click();

    // Verify Recruiter Outreach modal appears
    await expect(page.locator('text=1-Click Direct Outreach').first()).toBeVisible();
    await expect(page.locator('text=LinkedIn Note (300 Chars)').first()).toBeVisible();

    // Verify close modal
    const closeBtn = page.locator('button[title="Close"]').or(page.locator('button:has-text("Close")')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
