import path from 'node:path';
import { expect, test } from '@playwright/test';
import { expectVerdict } from './helpers';

// Chrome on Windows has no built-in BarcodeDetector, so these exercise the
// ZXing fallback — the path that was broken for desktop users.
const LABEL = path.join(__dirname, 'fixtures', 'tropika-label.png');

test.describe('verification from photos', () => {
  test('scanner reads a barcode from an uploaded photo', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByText(/products in the registry/)).toBeVisible();
    await page.getByRole('button', { name: /Scan barcode/ }).click();
    await page.getByRole('dialog', { name: 'Scan a barcode' }).locator('input[type=file]').setInputFiles(LABEL);
    await expect(page.getByLabel('Barcode', { exact: true })).toHaveValue('6150000000051');
    await expect(page.getByLabel('Product', { exact: true })).toHaveValue('Tropika Orange Juice');
  });

  test('a label photo fills every field and runs the four checks', async ({ page }) => {
    test.skip(!process.env.GOOGLE_GENAI_API_KEY, 'needs GOOGLE_GENAI_API_KEY for the AI label reader');
    test.setTimeout(120_000);
    await page.goto('/verify');
    await expect(page.getByText(/products in the registry/)).toBeVisible();
    await page.getByLabel('Label photo').setInputFiles(LABEL);

    await expect(page.getByText('Label read', { exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByLabel('Barcode', { exact: true })).toHaveValue('6150000000051');
    await expect(page.getByLabel('NAFDAC no.')).toHaveValue('A8-0005');
    await expect(page.getByLabel('Expiry date')).toHaveValue('2027-03-14');
    await expectVerdict(page, 'Looks good');
  });
});
