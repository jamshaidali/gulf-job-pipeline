import { test, expect } from '@playwright/test';

test.describe('Public Landing Page & Multi-Role Dynamic Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page with title and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/TalentRadar/i);
    // Brand header
    await expect(page.locator('header').first()).toContainText(/TalentRadar/i);
    // Call to actions
    await expect(page.getByRole('link', { name: /launch free radar|get started|browse live jobs/i }).first()).toBeVisible();
  });

  test('should display multi-market support for Pakistan, UAE, and Saudi Arabia', async ({ page }) => {
    const textContent = await page.textContent('body');
    expect(textContent).toMatch(/Pakistan/i);
    expect(textContent).toMatch(/UAE|Dubai/i);
    expect(textContent).toMatch(/Saudi|Riyadh/i);
  });

  test('should render the dynamic multi-role career carousel', async ({ page }) => {
    // Locate the carousel container or role highlights
    const carouselSection = page.locator('section, div').filter({ hasText: /Senior Full Stack Engineer|Careem|Uber|Product Manager|Finance|Chartered Accountant/i }).first();
    await expect(carouselSection).toBeVisible();

    // Verify it contains target tech and non-tech career indicators
    const bodyText = await page.textContent('body');
    const hasDiverseRoles = /Software|Engineer|Finance|Accountant|Product|Marketing/i.test(bodyText || '');
    expect(hasDiverseRoles).toBeTruthy();
  });

  test('should display transparent pricing with $4.99/mo Pro tier', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/\$4\.99/i);
    expect(bodyText).toMatch(/free/i);
  });

  test('should navigate to login page when clicking sign in', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /sign in|login|log in/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
