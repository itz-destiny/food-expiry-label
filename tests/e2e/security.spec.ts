import { expect, test } from '@playwright/test';
import { supabaseKey, supabaseUrl } from './helpers';

// Row-level security, exercised as an anonymous visitor against the real API.
test.describe('Supabase access rules (anonymous)', () => {
  const headers = () => ({ apikey: supabaseKey(), 'Content-Type': 'application/json' });

  test('anyone can read the product registry', async ({ request }) => {
    const res = await request.get(`${supabaseUrl()}/rest/v1/products?select=name`, { headers: headers() });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).length).toBeGreaterThan(0);
  });

  test('anyone can read anonymised report signals', async ({ request }) => {
    const res = await request.post(`${supabaseUrl()}/rest/v1/rpc/report_signals`, { headers: headers(), data: {} });
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(Array.isArray(rows)).toBeTruthy();
    for (const row of rows) {
      expect(row).not.toHaveProperty('user_id');
      expect(row).not.toHaveProperty('photo_path');
    }
  });

  test('raw reports and profiles are hidden', async ({ request }) => {
    for (const table of ['reports', 'profiles']) {
      const res = await request.get(`${supabaseUrl()}/rest/v1/${table}?select=*`, { headers: headers() });
      expect(res.ok()).toBeTruthy();
      expect(await res.json()).toEqual([]);
    }
  });

  test('anonymous users cannot file reports or add products', async ({ request }) => {
    const report = await request.post(`${supabaseUrl()}/rest/v1/reports`, {
      headers: headers(),
      data: { product_name: 'x', product_key: 'x', store_location: 'x', label_description: 'x', status: 'Pending' },
    });
    expect(report.ok()).toBeFalsy();

    const product = await request.post(`${supabaseUrl()}/rest/v1/products`, { headers: headers(), data: { name: 'x' } });
    expect(product.ok()).toBeFalsy();
  });

  test('is_admin() is not exposed through the API', async ({ request }) => {
    const res = await request.post(`${supabaseUrl()}/rest/v1/rpc/is_admin`, { headers: headers(), data: {} });
    expect(res.ok()).toBeFalsy();
  });

  test('anonymous users cannot upload evidence', async ({ request }) => {
    const res = await request.post(`${supabaseUrl()}/storage/v1/object/evidence/anon/test.jpg`, {
      headers: { apikey: supabaseKey(), Authorization: `Bearer ${supabaseKey()}`, 'Content-Type': 'image/jpeg' },
      data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    });
    expect(res.ok()).toBeFalsy();
  });
});
