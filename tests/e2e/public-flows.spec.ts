import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, expectVerdict, isoDate, runChecks } from './helpers';

test.describe('home', () => {
  test('hero, four-check story, modules and CTA render @mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Is your food label telling the truth?' })).toBeVisible();
    await expect(page.getByText('Illustrative demo')).toBeVisible();

    // Scroll to the end of the four-checks story: the label stamps a verdict.
    const story = page.locator('#checks');
    await story.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const el = document.getElementById('checks')!;
      window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight);
    });
    await expect(page.getByText('Verification Facts')).toBeVisible();
    await expect(story.getByText('Suspicious', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: /regulator.s desk/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Verify a product' }).last()).toHaveAttribute('href', '/verify');
    await expectNoHorizontalScroll(page);
  });

  test('header navigation reaches every page', async ({ page }) => {
    await page.goto('/');
    // Let the dev build finish hydrating before clicking client-side links.
    await page.waitForLoadState('networkidle');
    const nav = page.getByRole('banner');
    for (const [label, path] of [
      ['Verify', '/verify'],
      ['Report', '/report'],
      ['Awareness', '/awareness'],
      ['Dashboard', '/admin'],
      ['Home', '/'],
    ] as const) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await page.waitForLoadState('networkidle');
      // Dev mode compiles each route on first visit; the URL updates once it's ready.
      await expect(page).toHaveURL(path, { timeout: 60_000 });
    }
  });

  test('mobile menu opens and navigates @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('banner').getByRole('link', { name: 'Awareness', exact: true }).click();
    await expect(page).toHaveURL('/awareness', { timeout: 60_000 });
  });
});

test.describe('verify: the four checks against the live registry', () => {
  test('registry loads from Supabase and suggestions work', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByText(/[1-9]\d* products in the registry/)).toBeVisible();
    await page.getByLabel('Product', { exact: true }).fill('tropi');
    await page.getByRole('button', { name: /Tropika Orange Juice/ }).click();
    await expect(page.getByLabel('Product', { exact: true })).toHaveValue('Tropika Orange Juice');
    await expect(page.getByLabel('Barcode', { exact: true })).toHaveValue('6150000000051');
  });

  test('valid product passes all four checks', async ({ page }) => {
    await runChecks(page, { query: 'Tropika Orange Juice', expiry: isoDate(200), nafdac: 'A8-0005' });
    await expectVerdict(page, 'Looks good');
    await expect(page.getByText('Pass', { exact: true })).toHaveCount(4);
  });

  test('near-expiry product is flagged', async ({ page }) => {
    await runChecks(page, { query: 'Tropika Orange Juice', expiry: isoDate(10), nafdac: 'A8-0005' });
    await expectVerdict(page, 'Approaching expiry');
    await expect(page.getByText(/Expires in 10 days/)).toBeVisible();
  });

  test('expired product is invalid', async ({ page }) => {
    await runChecks(page, { query: 'Tropika Orange Juice', expiry: isoDate(-5), nafdac: 'A8-0005' });
    await expectVerdict(page, 'Do not buy');
    await expect(page.getByText(/Expired 5 days ago/)).toBeVisible();
  });

  test('NAFDAC mismatch is suspicious', async ({ page }) => {
    await runChecks(page, { query: 'Tropika Orange Juice', expiry: isoDate(200), nafdac: 'A8-0050' });
    await expectVerdict(page, 'Suspicious product');
    await expect(page.getByText('Does not match record')).toBeVisible();
  });

  test('unknown product is not in the registry', async ({ page }) => {
    await runChecks(page, { query: 'Definitely Not A Real Product', expiry: isoDate(200), nafdac: 'A1-1234' });
    await expectVerdict(page, 'Not in the registry');
  });

  test('barcode-only lookup finds the product', async ({ page }) => {
    await runChecks(page, { barcode: '6150000000013', expiry: isoDate(200) });
    await expect(page.getByText('Found in registry')).toBeVisible();
    await expect(page.getByText(/SunHarvest Instant Oats/).first()).toBeVisible();
  });

  test('"Report this product" carries the details to the report form', async ({ page }) => {
    await runChecks(page, { query: 'Tropika Orange Juice', expiry: isoDate(-5), nafdac: 'A8-0050' });
    await page.getByRole('link', { name: 'Report this product' }).click();
    await expect(page).toHaveURL(/\/report\?product=Tropika\+Orange\+Juice.*nafdac=A8-0050/, { timeout: 60_000 });
  });

  test('verify page fits a phone screen @mobile', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByRole('button', { name: 'Run the 4 checks' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe('signed-out gates', () => {
  test('report page asks for login', async ({ page }) => {
    await page.goto('/report');
    await expect(page.getByText('Log in to submit evidence')).toBeVisible();
    await page.getByRole('link', { name: 'Log in' }).last().click();
    await expect(page).toHaveURL('/login?next=/report', { timeout: 60_000 });
  });

  test('admin dashboard is restricted', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Restricted area')).toBeVisible();
  });
});

test.describe('awareness', () => {
  test('tips and community alerts load @mobile', async ({ page }) => {
    await page.goto('/awareness');
    for (const tip of ['Use-by vs best-before', 'Look for the NAFDAC number', 'Spot tampered dates']) {
      await expect(page.getByRole('heading', { name: tip })).toBeVisible();
    }
    // Alerts come from report_signals(); either alerts or the empty state, never the error.
    await expect(page.getByText(/Confirmed suspicious products/i)).toBeVisible();
    await expect(page.getByText('Alerts are unavailable')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('auth forms', () => {
  test('sign-up rejects mismatched passwords before contacting the server', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('someone@example.test');
    await page.getByLabel('Password', { exact: true }).fill('abcdef123');
    await page.getByLabel('Confirm password').fill('different123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('login and sign-up link to each other and keep ?next', async ({ page }) => {
    await page.goto('/login?next=/report');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL('/signup?next=%2Freport', { timeout: 60_000 });
  });
});
