import { expect, type Page } from '@playwright/test';

/** yyyy-mm-dd, `days` from today. */
export function isoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function runChecks(
  page: Page,
  input: { query?: string; barcode?: string; expiry?: string; nafdac?: string }
) {
  await page.goto('/verify');
  if (input.query) await page.getByLabel('Product', { exact: true }).fill(input.query);
  if (input.barcode) await page.getByLabel('Barcode', { exact: true }).fill(input.barcode);
  if (input.expiry) await page.getByLabel('Expiry date').fill(input.expiry);
  if (input.nafdac) await page.getByLabel('NAFDAC no.').fill(input.nafdac);
  // Wait until the registry has loaded so the product lookup has data.
  await expect(page.getByText(/products in the registry/)).toBeVisible();
  await page.getByRole('button', { name: 'Run the 4 checks' }).click();
  await expect(page.getByText('Verdict', { exact: true })).toBeVisible();
}

export async function expectVerdict(page: Page, title: string) {
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
