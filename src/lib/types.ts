export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  size?: string;
  manufacturer?: string;
  barcode?: string;
  nafdacNumber?: string;
  /** Batch expiry on record, used when the shopper doesn't type one in. */
  expiryDate?: string;
  /** Sample records seeded with the project, versus records added by admins. */
  source: 'sample' | 'database';
}

export type ReportStatus = 'Pending' | 'Under Review' | 'Confirmed Suspicious' | 'Action Taken' | 'Dismissed';

export const REPORT_STATUSES: ReportStatus[] = [
  'Pending',
  'Under Review',
  'Confirmed Suspicious',
  'Action Taken',
  'Dismissed',
];

export interface Report {
  id: string;
  productName: string;
  productKey?: string;
  barcode?: string;
  nafdacNumber?: string;
  expiryDate?: string;
  storeLocation: string;
  observedAt?: string;
  labelDescription: string;
  /** Path inside the private `evidence` storage bucket. */
  photoPath?: string;
  analysisResult?: string;
  /** Only present for the reporter's own reports and for admins. */
  userId?: string;
  reportStatus: ReportStatus;
  actionNote?: string;
  submissionDate?: string;
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}
