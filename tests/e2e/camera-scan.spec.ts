import path from 'node:path';
import { expect, test } from '@playwright/test';

// Chrome plays tropika-label.mjpeg as a fake webcam and grants camera access
// without a prompt, so the live scanner sees a real barcode.
test.use({
  permissions: ['camera'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-video-capture=${path.join(__dirname, 'fixtures', 'tropika-label.mjpeg')}`,
    ],
  },
});

test('the live camera scanner reads the barcode and fills the product', async ({ page }) => {
  await page.goto('/verify');
  await expect(page.getByText(/products in the registry/)).toBeVisible();
  await page.getByRole('button', { name: /Scan barcode/ }).click();
  await expect(page.getByLabel('Barcode', { exact: true })).toHaveValue('6150000000051', { timeout: 30_000 });
  await expect(page.getByLabel('Product', { exact: true })).toHaveValue('Tropika Orange Juice');
  await expect(page.getByRole('dialog', { name: 'Scan a barcode' })).toHaveCount(0);
});
