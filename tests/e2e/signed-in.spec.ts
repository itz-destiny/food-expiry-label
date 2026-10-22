import { expect, test, type Page } from '@playwright/test';
import { expectVerdict, isoDate, runChecks } from './helpers';

/*
 * Signed-in flows: evidence submission, admin review and registry management.
 * They need two existing, email-confirmed accounts in the Supabase project:
 *
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD     a normal consumer account
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   an account whose profiles.role = 'admin'
 *
 * Put them in .env.test.local (git-ignored). Without them these tests skip.
 * They write real rows: a report (dismissed again at the end) and an
 * "[E2E]" product.
 */
const user = { email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD };
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };

// 1×1 PNG used as photo evidence.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function login(page: Page, email: string, password: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(next);
}

test.describe.serial('signed-in flows', () => {
  test.skip(!user.email || !user.password || !admin.email || !admin.password, 'Set E2E_USER_* and E2E_ADMIN_* to run');

  const product = `E2E Juice ${Date.now()}`;

  test('consumer submits a report with photo evidence', async ({ page }) => {
    await login(page, user.email!, user.password!, '/report');
    await page.getByLabel('Product name').fill(product);
    await page.getByLabel('Where you saw it').fill('E2E test store');
    await page.getByLabel('What looks wrong?').fill('Automated end-to-end test report.');
    await page.locator('input[type=file]').setInputFiles({ name: 'label.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByAltText('Evidence preview')).toBeVisible();
    await page.getByRole('button', { name: 'Submit report' }).click();
    await expect(page.getByText('Report submitted')).toBeVisible({ timeout: 60_000 });
  });

  test('the new report makes the product show as reported', async ({ page }) => {
    await runChecks(page, { query: product, expiry: isoDate(200) });
    await expect(page.getByText('1 report')).toBeVisible();
  });

  test('a consumer account cannot open the dashboard', async ({ page }) => {
    await login(page, user.email!, user.password!, '/admin');
    await expect(page.getByText("This account isn't an administrator")).toBeVisible();
  });

  test('admin reviews the report and records the action', async ({ page }) => {
    await login(page, admin.email!, admin.password!, '/admin');
    await page.getByRole('button', { name: new RegExp(product) }).click();
    await expect(page.getByAltText(`Evidence for ${product}`)).toBeVisible();
    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: 'Dismissed' }).click();
    await page.getByLabel('Action taken / note').fill('Closed by automated E2E test.');
    await page.getByRole('button', { name: 'Save review' }).click();
    await expect(page.getByText('Report updated')).toBeVisible();
  });

  test('admin adds a product that the verifier can then find', async ({ page }) => {
    await login(page, admin.email!, admin.password!, '/admin');
    await page.getByRole('tab', { name: 'Products' }).click();
    const name = `[E2E] ${product}`;
    await page.getByLabel('Product name').fill(name);
    await page.getByLabel('NAFDAC no.').fill('A1-9876');
    await page.getByRole('button', { name: 'Add to registry' }).click();
    await expect(page.getByText('Product added')).toBeVisible();

    await runChecks(page, { query: name, expiry: isoDate(200), nafdac: 'A1-9876' });
    await expectVerdict(page, 'Looks good');
  });
});
