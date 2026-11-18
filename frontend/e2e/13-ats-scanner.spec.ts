import { test, expect } from '@playwright/test';

test.describe('ATS Resume Scanner & Job Description Fit Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ats-scanner');
  });

  test('should load the ATS Scanner page with hero, inputs, and guidance', async ({ page }) => {
    // Header & Brand
    await expect(page.locator('h1')).toContainText(/Check Your CV ATS Score/i);
    await expect(page.getByText(/AI ATS Resume Diagnostic Engine/i)).toBeVisible();

    // Dual input panes
    await expect(page.getByRole('heading', { name: /Your Resume \/ CV/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Target Job Description/i })).toBeVisible();

    // Scan CTA button
    await expect(page.getByRole('button', { name: /Scan Resume Against Job Description/i })).toBeVisible();
  });

  test('should prefill data when clicking Load Sample Gulf Tech Job', async ({ page }) => {
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample Gulf Tech Job/i }).first();
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Verify inputs have been populated
    const cvTextarea = page.locator('textarea').first();
    await expect(cvTextarea).not.toBeEmpty();

    const jdTextarea = page.locator('textarea').nth(1);
    await expect(jdTextarea).not.toBeEmpty();

    // Verify company or job title prefilled
    const inputs = page.locator('input[type="text"]');
    await expect(inputs.first()).toHaveValue(/Senior Backend/i);
  });

  test('should run scan and display circular ATS score, verdict, and sub-scores', async ({ page }) => {
    // Load sample
    await page.getByRole('button', { name: /Load Sample Gulf Tech Job/i }).first().click();

    // Click scan
    const scanBtn = page.getByRole('button', { name: /Scan Resume Against Job Description/i });
    await scanBtn.click();

    // Wait for results section
    await expect(page.getByText(/ATS Score/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Top Recommended Fixes to Reach 90%/i)).toBeVisible();

    // Check that sub-score cards appear
    await expect(page.getByText(/Technical Skills/i).first()).toBeVisible();
    await expect(page.getByText(/Soft Skills/i).first()).toBeVisible();
    await expect(page.getByText(/Experience Impact/i).first()).toBeVisible();
    await expect(page.getByText(/Formatting Audit/i).first()).toBeVisible();
  });

  test('should navigate between diagnostic tabs and reveal tailored bullets & templates', async ({ page }) => {
    // Load sample & run scan
    await page.getByRole('button', { name: /Load Sample Gulf Tech Job/i }).first().click();
    await page.getByRole('button', { name: /Scan Resume Against Job Description/i }).click();

    await expect(page.getByText(/ATS Score/i).first()).toBeVisible({ timeout: 15000 });

    // Tab 1: Keywords & Skills Gap
    await expect(page.getByText(/Missing Critical Technical Skills/i)).toBeVisible();
    await expect(page.getByText(/Matched Technical Skills/i)).toBeVisible();

    // Tab 2: Section Audit
    await page.getByRole('button', { name: /2\. ATS Section & Formatting Audit/i }).click();
    await expect(page.getByText(/Contact Information & Header/i)).toBeVisible();
    await expect(page.getByText(/Professional Summary Section/i)).toBeVisible();
    await expect(page.getByText(/Action Verbs Found/i)).toBeVisible();

    // Tab 3: AI-Tailored Resume Kit
    await page.getByRole('button', { name: /3\. AI-Tailored Resume Kit/i }).click();
    await expect(page.getByText(/Optimized ATS Headline/i)).toBeVisible();
    await expect(page.getByText(/Tailored Professional Executive Summary/i)).toBeVisible();
    await expect(page.getByText(/Google X-Y-Z Achievement Bullets/i)).toBeVisible();

    // Verify 1-click Copy works
    const copyBtn = page.getByRole('button', { name: /Copy Headline/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText(/Copied!/i)).toBeVisible();

    // Open 105+ Template Gallery
    const exportBtn = page.getByRole('button', { name: /Export Tailored CV/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Template Gallery Modal should pop up
    await expect(page.getByText(/Select Your Tailored CV Template/i)).toBeVisible({ timeout: 5000 });
  });

  test('should be accessible from Navbar link', async ({ page }) => {
    await page.goto('/');
    const atsNavLink = page.getByRole('link', { name: /ATS Scanner/i }).first();
    await expect(atsNavLink).toBeVisible();
    await atsNavLink.click();
    await expect(page).toHaveURL(/\/ats-scanner/);
  });
});
