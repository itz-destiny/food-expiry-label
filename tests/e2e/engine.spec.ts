import { expect, test } from '@playwright/test';
import { verifyProduct, type Verdict } from '../../src/lib/verification';
import type { Product, Report } from '../../src/lib/types';

// Pure tests of the Intelligent Verification Engine (no browser needed).
const products: Product[] = [
  { id: '1', name: 'Tropika Orange Juice', brand: 'Tropika', size: '1 L', barcode: '6150000000055', nafdacNumber: 'A8-0005', source: 'sample' },
  { id: '2', name: 'SunHarvest Instant Oats', brand: 'SunHarvest', barcode: '6150000000017', nafdacNumber: 'A1-0001', source: 'sample' },
  { id: '3', name: 'Meadowfresh Evaporated Milk', nafdacNumber: '01-0002', source: 'sample' },
  { id: '4', name: 'RedValley Tomato Paste', nafdacNumber: '02-0004', source: 'sample' },
  { id: '5', name: 'PureDrop Vegetable Oil', nafdacNumber: '04-0008', source: 'sample' },
];
const reports: Report[] = [
  { id: 'r1', productName: 'RedValley Tomato Paste', storeLocation: 'x', labelDescription: 'y', reportStatus: 'Pending' },
  { id: 'r2', productName: 'PureDrop Vegetable Oil', storeLocation: 'x', labelDescription: 'y', reportStatus: 'Dismissed' },
];
const today = new Date('2026-10-22T12:00:00');

const cases: [string, Parameters<typeof verifyProduct>[0], Verdict][] = [
  ['all checks pass', { query: 'Tropika Orange Juice', labelExpiry: '2027-03-14', labelNafdac: 'a8-0005' }, 'valid'],
  ['expires within 30 days', { query: 'tropika', labelExpiry: '2026-11-05', labelNafdac: 'A8-0005' }, 'near-expiry'],
  ['expired', { query: 'tropika', labelExpiry: '2026-09-01', labelNafdac: 'A8-0005' }, 'invalid'],
  ['no expiry date at all', { query: 'tropika', labelNafdac: 'A8-0005' }, 'invalid'],
  ['found by barcode', { query: '', barcode: '6150000000017', labelExpiry: '2027-01-01' }, 'valid'],
  ['found by NAFDAC number', { query: '01-0002', labelExpiry: '2027-01-01' }, 'valid'],
  ['unknown product', { query: 'Mystery Cola', labelExpiry: '2027-01-01', labelNafdac: 'A1-9999' }, 'not-found'],
  ['malformed NAFDAC number', { query: 'tropika', labelExpiry: '2027-01-01', labelNafdac: '12345' }, 'invalid'],
  ['NAFDAC number does not match record', { query: 'tropika', labelExpiry: '2027-01-01', labelNafdac: 'A8-0050' }, 'suspicious'],
  ['open consumer report', { query: 'redvalley tomato', labelExpiry: '2027-01-01' }, 'suspicious'],
  ['dismissed report is ignored', { query: 'puredrop', labelExpiry: '2027-01-01' }, 'valid'],
];

test.describe('verification engine', () => {
  for (const [name, input, verdict] of cases) {
    test(name, () => {
      const result = verifyProduct(input, products, reports, today);
      expect(result.verdict).toBe(verdict);
      expect(result.checks.map((c) => c.id)).toEqual(['expiry', 'database', 'nafdac', 'reports']);
    });
  }
});
