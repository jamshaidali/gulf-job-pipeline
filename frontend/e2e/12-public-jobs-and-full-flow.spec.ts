import { test, expect } from '@playwright/test';

test.describe('Public Jobs, Landing FAQ, Pro Upgrade/Downgrade & Job Trash/Restore Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure clean test session
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');
  });

  test('should explore public jobs directory with search and region filters', async ({ page }) => {
    await page.goto('/jobs');

    // Verify page heading
    await expect(page.locator('h1')).toContainText(/Explore Open Tech Roles/i);

    // Verify public job listing renders
    const jobItems = page.locator('div[class*="rounded-2xl"]').filter({ hasText: /View Role & Match/i });
    await expect(jobItems.first()).toBeVisible({ timeout: 10000 });

    // Test search filter
    const searchInput = page.getByPlaceholder(/Search by title, skill/i);
    await searchInput.fill('Engineer');
    await page.waitForTimeout(500);
    await expect(jobItems.first()).toBeVisible();

    // Test region filter pills
    const gulfBtn = page.getByRole('button', { name: /Gulf/i });
    await expect(gulfBtn).toBeVisible();
    await gulfBtn.click();
    await page.waitForTimeout(500);

    const pkBtn = page.getByRole('button', { name: /Pakistan/i });
    await expect(pkBtn).toBeVisible();
    await pkBtn.click();
    await page.waitForTimeout(500);

    const allBtn = page.getByRole('button', { name: /All Regions/i });
    await allBtn.click();
    await page.waitForTimeout(500);
    await expect(jobItems.first()).toBeVisible();
  });

  test('should expand and collapse FAQ accordion on the landing page', async ({ page }) => {
    await page.goto('/');

    // Locate FAQ heading
    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();

    // Click the first FAQ question
    const firstQuestion = faqSection.locator('button').filter({ hasText: /How does the AI match score calculate/i });
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.click();

    // Verify answer becomes visible
    const firstAnswer = faqSection.locator('text=TalentRadar analyzes the official job requirements');
    await expect(firstAnswer).toBeVisible();

    // Click another question
    const recruiterQuestion = faqSection.locator('button').filter({ hasText: /1-Click Recruiter Outreach/i });
    await expect(recruiterQuestion).toBeVisible();
    await recruiterQuestion.click();

    // Verify recruiter answer is visible
    const recruiterAnswer = faqSection.locator('text=personalized 300-character LinkedIn connection note');
    await expect(recruiterAnswer).toBeVisible();
  });

  test('should complete full Pro upgrade and downgrade lifecycle with paywall unlock', async ({ page }) => {
    // 1. Log in as free tier user
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('freeuser');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });

    // 2. Verify free user paywall card is present for 4th job
    const lockedCard = page.locator('text=Pro Tier Opportunity');
    await expect(lockedCard.first()).toBeVisible({ timeout: 10000 });

    // 3. Trigger upgrade modal by clicking "Unlock with Pro" inside locked card
    const unlockBtn = page.getByRole('button', { name: /Unlock with Pro/i }).first();
    await unlockBtn.click();

    // 4. Modal is visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Unlock Uncapped Market Access')).toBeVisible();

    // 5. Click "Unlock All Opportunities with Pro Now →"
    const confirmUpgradeBtn = modal.getByRole('button', { name: /Unlock All Opportunities with Pro Now/i });
    await expect(confirmUpgradeBtn).toBeVisible();
    await confirmUpgradeBtn.click();

    // 6. Verify modal closes and Pro status activates
    await expect(modal).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Pro Accelerator/i }).first()).toBeVisible();

    // 7. Verify locked card is now replaced by unlocked role actions
    await expect(page.locator('text=Pro Tier Opportunity')).not.toBeVisible();
    const recruiterButtons = page.getByRole('button', { name: /Reach Recruiter 300c/i });
    await expect(recruiterButtons.first()).toBeVisible();

    // 8. Reopen modal via sidebar Pro Accelerator button to test downgrade back to free tier
    const proPerksBtn = page.getByRole('button', { name: /Pro Accelerator/i }).first();
    await proPerksBtn.click();
    await expect(modal).toBeVisible();

    // Click "Test Free Tier (Gated)" QA switcher
    const downgradeBtn = modal.getByRole('button', { name: /Test Free Tier \(Gated\)/i });
    await expect(downgradeBtn).toBeVisible();
    await downgradeBtn.click();

    // Verify modal closes and locked card returns
    await expect(modal).not.toBeVisible();
    await expect(page.locator('text=Free Search Limit:')).toBeVisible();
    await expect(lockedCard.first()).toBeVisible();
  });

  test('should move a job to Trash and restore it to the active feed', async ({ page }) => {
    // 1. Log in as admin user
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });

    // 2. Identify first job card and get its title
    const firstCard = page.locator('div[class*="rounded-3xl"]').first();
    await expect(firstCard).toBeVisible();

    // Click "Move to Trash / Ignore this role"
    const trashBtn = page.getByRole('button', { name: /Move to Trash \/ Ignore this role/i }).first();
    await expect(trashBtn).toBeVisible();
    await trashBtn.click();

    // 3. Navigate to Archive & Trash tab via sidebar
    const archiveNavBtn = page.getByRole('button', { name: /Archive & Trash/i });
    await expect(archiveNavBtn).toBeVisible();
    await archiveNavBtn.click();

    // 4. In Trash view, verify Restore button exists and click it
    const restoreBtn = page.getByRole('button', { name: /Restore/i }).first();
    await expect(restoreBtn).toBeVisible({ timeout: 10000 });
    await restoreBtn.click();

    // 5. Return to All Opportunities
    const allOpportunitiesBtn = page.getByRole('button', { name: /All Opportunities/i });
    await allOpportunitiesBtn.click();
    await expect(page.locator('text=Total Scored Jobs').first()).toBeVisible();
  });
});
