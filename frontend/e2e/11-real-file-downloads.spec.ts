import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Real File Downloads - ATS Tailored PDF and DOCX Exports', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limits to ensure clean test session
    await page.request.post('http://127.0.0.1:8000/api/test/reset-rate-limit');

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('jamshaid');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test('should download valid tailored PDF resume from job card', async ({ page }) => {
    // Open first job card's detail drawer
    const detailsBtn = page.getByRole('button', { name: /ATS Bullets & Cover Letter/i }).first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Switch to 1-Click Tailored CV subtab
    const tailoredCvTab = page.getByRole('button', { name: /1-Click Tailored CV/i });
    await expect(tailoredCvTab).toBeVisible();
    await tailoredCvTab.click();

    // Locate Download PDF button
    const downloadPdfBtn = page.getByRole('button', { name: /Download PDF \(\.pdf\)/i });
    await expect(downloadPdfBtn).toBeVisible();

    // Trigger download and intercept browser event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await downloadPdfBtn.click();
    const download = await downloadPromise;

    // Verify filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/i);

    // Save and verify byte size is non-trivial (>2KB)
    const downloadDir = path.join(process.cwd(), 'test-downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    const filePath = path.join(downloadDir, filename);
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(2000);

    // Verify PDF header magic bytes (%PDF)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    expect(buffer.toString('utf-8')).toBe('%PDF');

    // Clean up file
    fs.unlinkSync(filePath);
  });

  test('should download valid tailored Word DOCX resume from job card', async ({ page }) => {
    // Open first job card detail
    await page.getByRole('button', { name: /ATS Bullets & Cover Letter/i }).first().click();

    // Switch to 1-Click Tailored CV subtab
    await page.getByRole('button', { name: /1-Click Tailored CV/i }).click();

    // Locate Word Doc export button
    const docxBtn = page.getByRole('button', { name: /Word Doc \(\.docx\)/i }).first();
    await expect(docxBtn).toBeVisible();

    // Trigger download and intercept browser event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await docxBtn.click();
    const download = await downloadPromise;

    // Verify filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.docx$/i);

    // Save and verify byte size (>1KB)
    const downloadDir = path.join(process.cwd(), 'test-downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    const filePath = path.join(downloadDir, filename);
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(1000);

    // Verify DOCX/ZIP header magic bytes (PK..)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(2);
    fs.readSync(fd, buffer, 0, 2, 0);
    fs.closeSync(fd);
    expect(buffer.toString('utf-8')).toBe('PK');

    // Clean up file
    fs.unlinkSync(filePath);
  });

  test('should select a template from 100+ gallery modal and export customized PDF', async ({ page }) => {
    // Open first job card detail and switch to Tailored CV
    await page.getByRole('button', { name: /ATS Bullets & Cover Letter/i }).first().click();
    await page.getByRole('button', { name: /1-Click Tailored CV/i }).click();

    // Open 100+ Templates Gallery Modal
    const browseBtn = page.getByRole('button', { name: /Choose from 100\+ Templates/i });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();

    // Scope to modal dialog
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Select Your Tailored CV Template')).toBeVisible();

    // Search for a specific template
    const searchInput = modal.getByPlaceholder(/Search 100\+ templates/i);
    await searchInput.fill('Silicon');

    // Select the template
    const selectBtn = modal.getByRole('button', { name: /Select/i }).first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
    }

    // Click "Download PDF in this Style" from modal footer
    const exportBtn = modal.getByRole('button', { name: /Download PDF in this Style/i });
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});
