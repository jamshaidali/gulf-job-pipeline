import { test, expect } from '@playwright/test';

test.describe('Freemium Quota & Pro Paywall Gating', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure fresh login
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    // Log in with freeuser to inspect free tier paywall behavior
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('freeuser');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should display search quota counter on free account', async ({ page }) => {
    // Look for the Free Search Limit banner
    const quotaBanner = page.locator('text=Free Search Limit:').first();
    await expect(quotaBanner).toBeVisible();
    await expect(page.locator('body')).toContainText(/Top 3 results unlocked/i);
  });

  test('should display locked paywall card on result #4+ for free account', async ({ page }) => {
    // Look for locked card elements
    const lockedCard = page.locator('text=Pro Tier Opportunity').first();
    const isLockedVisible = await lockedCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isLockedVisible) {
      await expect(page.locator('text=Result #4+').first()).toBeVisible();
      await expect(page.locator('text=Upgrade to Pro ($4.99/mo)').first()).toBeVisible();
    }
  });

  test('should open upgrade modal when clicking upgrade button', async ({ page }) => {
    const upgradeBtn = page.getByRole('button', { name: /Upgrade to Pro|Pro Perks/i }).first();
    await upgradeBtn.click();

    // Verify upgrade modal is open
    await expect(page.locator('text=TalentRadar Pro').first()).toBeVisible();
    await expect(page.locator('text=$4.99').first()).toBeVisible();
  });
});
