import { test, expect } from '@playwright/test';

test.describe('Public SEO Career & Migration Guides (/guides)', () => {
  test('should load the guides directory with all featured articles', async ({ page }) => {
    await page.goto('/guides');
    await expect(page).toHaveTitle(/Career Guides/i);
    
    // Check main title
    await expect(page.locator('h1')).toContainText(/Proven Strategies|Gulf Region/i);
    
    // Check that published SSG guides exist
    await expect(page.getByRole('link', { name: /How Pakistani Tech & Finance Professionals/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Saudi Arabia Vision 2030/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /The 2026 ATS Resume Optimization Checklist/i })).toBeVisible();
  });

  test('should navigate into UAE guide and render full checklist & content', async ({ page }) => {
    await page.goto('/guides/how-pakistanis-land-uae-tech-jobs');
    
    // Breadcrumb and title
    await expect(page.locator('h1')).toContainText(/How Pakistani Tech & Finance Professionals/i);
    
    // Verify checklist / actionable points exist
    const textContent = await page.textContent('body');
    expect(textContent).toMatch(/Target ATS Formats|Green Visa|Salary/i);
    
    // Verify CTA back to dashboard / register
    const cta = page.getByRole('link', { name: /Launch Free Radar|Get Started/i });
    await expect(cta).toBeVisible();
  });

  test('should navigate into Saudi Vision 2030 guide and render details', async ({ page }) => {
    await page.goto('/guides/saudi-arabia-vision-2030-hiring-guide');
    await expect(page.locator('h1')).toContainText(/Saudi Arabia Vision 2030/i);
    const textContent = await page.textContent('body');
    expect(textContent).toMatch(/Riyadh/i);
    expect(textContent).toMatch(/NEOM/i);
  });
});
