import { differenceInCalendarDays, format } from 'date-fns';
import type { Product, Report } from './types';

/** Days before expiry at which a product counts as "approaching expiry". */
export const NEAR_EXPIRY_DAYS = 30;

/** Reports in these states no longer count against a product. */
const CLOSED_STATUSES = new Set(['Dismissed']);

// NAFDAC numbers look like "A1-1234", "01-1234" or "A7-1234L".
const NAFDAC_PATTERN = /^[A-Z0-9]{2}-\d{4,6}[A-Z]?$/;

export type CheckId = 'expiry' | 'database' | 'nafdac' | 'reports';
export type CheckStatus = 'pass' | 'warn' | 'fail';
export type Verdict = 'valid' | 'near-expiry' | 'invalid' | 'not-found' | 'suspicious';

export interface CheckResult {
  id: CheckId;
  question: string;
  status: CheckStatus;
  answer: string;
  detail: string;
}

export interface VerificationInput {
  query: string;
  barcode?: string;
  labelExpiry?: string;
  labelNafdac?: string;
}

export interface VerificationResult {
  input: VerificationInput;
  product: Product | null;
  checks: CheckResult[];
  verdict: Verdict;
  matchingReports: Report[];
  checkedAt: Date;
}

export const CHECK_QUESTIONS: Record<CheckId, string> = {
  expiry: 'Is the expiry date valid?',
  database: 'Is the product in the database?',
  nafdac: 'Is the NAFDAC registration number present?',
  reports: 'Has the product been reported as suspicious?',
};

export function normalize(value: string | undefined | null): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function productKey(value: string | undefined | null): string {
  return normalize(value).replace(/ /g, '-');
}

export function normalizeNafdac(value: string | undefined | null): string {
  return (value ?? '').toUpperCase().replace(/\s+/g, '').replace(/[–—_]/g, '-');
}

export function isNafdacFormat(value: string): boolean {
  return NAFDAC_PATTERN.test(normalizeNafdac(value));
}

function digits(value: string | undefined | null): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Product Search and Retrieval Engine: barcode, then NAFDAC number, then name. */
export function findProduct(products: Product[], input: Pick<VerificationInput, 'query' | 'barcode' | 'labelNafdac'>): Product | null {
  const barcode = digits(input.barcode) || (/^\d{8,14}$/.test(input.query.trim()) ? input.query.trim() : '');
  if (barcode) {
    const byBarcode = products.find((p) => digits(p.barcode) === barcode);
    if (byBarcode) return byBarcode;
  }

  const nafdac = normalizeNafdac(input.labelNafdac) || (isNafdacFormat(input.query) ? normalizeNafdac(input.query) : '');
  if (nafdac) {
    const byNafdac = products.find((p) => normalizeNafdac(p.nafdacNumber) === nafdac);
    if (byNafdac) return byNafdac;
  }

  const q = normalize(input.query);
  if (!q) return null;
  const exact = products.find((p) => normalize(p.name) === q);
  if (exact) return exact;

  // Every word the shopper typed must appear in the product's name or brand.
  const words = q.split(' ').filter((w) => w.length > 1);
  if (!words.length) return null;
  const scored = products
    .map((p) => {
      const hay = normalize(`${p.name} ${p.brand ?? ''}`);
      const hits = words.filter((w) => hay.includes(w)).length;
      return { p, hits };
    })
    .filter((s) => s.hits === words.length)
    .sort((a, b) => a.p.name.length - b.p.name.length);
  return scored[0]?.p ?? null;
}

export function searchProducts(products: Product[], query: string, limit = 6): Product[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(' ');
  return products
    .filter((p) => {
      const hay = normalize(`${p.name} ${p.brand ?? ''} ${p.barcode ?? ''} ${p.nafdacNumber ?? ''}`);
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

export function reportsForProduct(reports: Report[], product: Product | null, input: VerificationInput): Report[] {
  const keys = new Set([productKey(input.query), product && productKey(product.name)].filter(Boolean) as string[]);
  const barcodes = new Set([digits(input.barcode), digits(product?.barcode)].filter(Boolean));
  const nafdacs = new Set([normalizeNafdac(input.labelNafdac), normalizeNafdac(product?.nafdacNumber)].filter(Boolean));

  return reports.filter((r) => {
    if (CLOSED_STATUSES.has(r.reportStatus)) return false;
    return (
      keys.has(r.productKey || productKey(r.productName)) ||
      (r.barcode && barcodes.has(digits(r.barcode))) ||
      (r.nafdacNumber && nafdacs.has(normalizeNafdac(r.nafdacNumber)))
    );
  });
}

function checkExpiry(input: VerificationInput, product: Product | null, today: Date): CheckResult {
  const raw = input.labelExpiry || product?.expiryDate;
  const base = { id: 'expiry' as const, question: CHECK_QUESTIONS.expiry };
  if (!raw) {
    return {
      ...base,
      status: 'fail',
      answer: 'No expiry date',
      detail: 'No expiry date was provided. Packaged food must carry a clear expiry or best-before date — avoid packs where it is missing or unreadable.',
    };
  }
  const date = new Date(raw);
  if (isNaN(date.getTime())) {
    return { ...base, status: 'fail', answer: 'Unreadable date', detail: `"${raw}" is not a valid calendar date.` };
  }
  const days = differenceInCalendarDays(date, today);
  const pretty = format(date, 'd MMM yyyy');
  const from = input.labelExpiry ? 'on the label' : 'on record for this batch';
  if (days < 0) {
    return {
      ...base,
      status: 'fail',
      answer: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`,
      detail: `The date ${from} is ${pretty}. Do not buy or consume this product.`,
    };
  }
  if (days <= NEAR_EXPIRY_DAYS) {
    return {
      ...base,
      status: 'warn',
      answer: days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`,
      detail: `The date ${from} is ${pretty}. It is still in date, but use it soon.`,
    };
  }
  return { ...base, status: 'pass', answer: `Valid until ${pretty}`, detail: `${days} days of shelf life left (date ${from}).` };
}

function checkDatabase(product: Product | null): CheckResult {
  const base = { id: 'database' as const, question: CHECK_QUESTIONS.database };
  if (!product) {
    return {
      ...base,
      status: 'fail',
      answer: 'Not found',
      detail: 'No matching record by name, barcode or NAFDAC number. Check the spelling, or treat an unknown product with caution.',
    };
  }
  const bits = [product.brand, product.size, product.manufacturer].filter(Boolean).join(' · ');
  return {
    ...base,
    status: 'pass',
    answer: 'Found in registry',
    detail: `${product.name}${bits ? ` — ${bits}` : ''}.${product.source === 'sample' ? ' (Sample registry record.)' : ''}`,
  };
}

function checkNafdac(input: VerificationInput, product: Product | null): CheckResult {
  const base = { id: 'nafdac' as const, question: CHECK_QUESTIONS.nafdac };
  const label = normalizeNafdac(input.labelNafdac);
  const record = normalizeNafdac(product?.nafdacNumber);

  if (label) {
    if (!isNafdacFormat(label)) {
      return {
        ...base,
        status: 'fail',
        answer: 'Invalid format',
        detail: `"${label}" doesn't look like a NAFDAC number (e.g. A1-1234 or 01-1234). A malformed number can be a sign of a fake label.`,
      };
    }
    if (record && record !== label) {
      return {
        ...base,
        status: 'fail',
        answer: 'Does not match record',
        detail: `The label shows ${label}, but this product is registered as ${record}. This mismatch is a strong warning sign.`,
      };
    }
    return {
      ...base,
      status: 'pass',
      answer: label,
      detail: record ? 'Present on the label and matches the registry record.' : 'Present on the label and correctly formatted.',
    };
  }
  if (record) {
    return {
      ...base,
      status: 'warn',
      answer: `Registered as ${record}`,
      detail: 'You did not enter the number from the pack. Confirm that this exact number is printed on the label.',
    };
  }
  return {
    ...base,
    status: 'fail',
    answer: 'Missing',
    detail: 'No NAFDAC registration number was found on the label or in the registry. Regulated food products must display one.',
  };
}

function checkReports(matching: Report[]): CheckResult {
  const base = { id: 'reports' as const, question: CHECK_QUESTIONS.reports };
  if (!matching.length) {
    return { ...base, status: 'pass', answer: 'No reports', detail: 'No open consumer reports for this product.' };
  }
  const confirmed = matching.filter((r) => r.reportStatus === 'Confirmed Suspicious' || r.reportStatus === 'Action Taken').length;
  return {
    ...base,
    status: 'fail',
    answer: `${matching.length} report${matching.length === 1 ? '' : 's'}`,
    detail: confirmed
      ? `${confirmed} report${confirmed === 1 ? ' has' : 's have'} been confirmed by regulators. Avoid this product.`
      : 'Consumers have flagged this product. The reports are awaiting review.',
  };
}

/** Intelligent Verification Engine: the four checks plus an overall verdict. */
export function verifyProduct(
  input: VerificationInput,
  products: Product[],
  reports: Report[],
  today: Date = new Date()
): VerificationResult {
  const product = findProduct(products, input);
  const matchingReports = reportsForProduct(reports, product, input);

  const expiry = checkExpiry(input, product, today);
  const database = checkDatabase(product);
  const nafdac = checkNafdac(input, product);
  const reportCheck = checkReports(matchingReports);

  // Highest-risk outcome wins.
  const nafdacMismatch = nafdac.answer === 'Does not match record';
  let verdict: Verdict;
  if (expiry.status === 'fail') verdict = 'invalid';
  else if (nafdacMismatch || reportCheck.status === 'fail') verdict = 'suspicious';
  else if (!product) verdict = 'not-found';
  else if (nafdac.status === 'fail') verdict = 'invalid';
  else if (expiry.status === 'warn') verdict = 'near-expiry';
  else verdict = 'valid';

  return {
    input,
    product,
    checks: [expiry, database, nafdac, reportCheck],
    verdict,
    matchingReports,
    checkedAt: today,
  };
}

export const VERDICT_COPY: Record<Verdict, { title: string; body: string }> = {
  valid: {
    title: 'Looks good',
    body: 'All four checks passed. Still inspect the pack for damage, swelling or broken seals before buying.',
  },
  'near-expiry': {
    title: 'Approaching expiry',
    body: 'The product is genuine and in date, but it expires soon. Buy only if you will use it before the date.',
  },
  invalid: {
    title: 'Do not buy',
    body: 'One or more label checks failed. The product is expired or its label information is invalid.',
  },
  'not-found': {
    title: 'Not in the registry',
    body: 'We could not match this product. It may be new, mislabelled or unregistered — be cautious and consider reporting it.',
  },
  suspicious: {
    title: 'Suspicious product',
    body: 'This product has been reported or its label does not match the registry. Avoid it and report what you see.',
  },
};
