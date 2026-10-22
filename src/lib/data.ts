import { supabase } from './supabase';
import type { Product, Report, ReportStatus } from './types';

/* Row shapes as stored in Postgres (snake_case). */
interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  manufacturer: string | null;
  barcode: string | null;
  nafdac_number: string | null;
  expiry_date: string | null;
  is_sample: boolean;
}

interface ReportRow {
  id: string;
  product_name: string;
  product_key: string | null;
  barcode: string | null;
  nafdac_number: string | null;
  expiry_date?: string | null;
  store_location: string;
  observed_at?: string | null;
  label_description: string;
  photo_path?: string | null;
  analysis_result?: string | null;
  user_id?: string;
  status: ReportStatus;
  action_note: string | null;
  created_at: string;
}

const orUndefined = <T,>(v: T | null | undefined) => v ?? undefined;

function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    brand: orUndefined(r.brand),
    category: orUndefined(r.category),
    size: orUndefined(r.size),
    manufacturer: orUndefined(r.manufacturer),
    barcode: orUndefined(r.barcode),
    nafdacNumber: orUndefined(r.nafdac_number),
    expiryDate: orUndefined(r.expiry_date),
    source: r.is_sample ? 'sample' : 'database',
  };
}

function toReport(r: ReportRow): Report {
  return {
    id: r.id,
    productName: r.product_name,
    productKey: orUndefined(r.product_key),
    barcode: orUndefined(r.barcode),
    nafdacNumber: orUndefined(r.nafdac_number),
    expiryDate: orUndefined(r.expiry_date),
    storeLocation: r.store_location,
    observedAt: orUndefined(r.observed_at),
    labelDescription: r.label_description,
    photoPath: orUndefined(r.photo_path),
    analysisResult: orUndefined(r.analysis_result),
    userId: r.user_id,
    reportStatus: r.status,
    actionNote: orUndefined(r.action_note),
    submissionDate: r.created_at,
  };
}

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/** Product Search and Retrieval Engine: the registry. */
export async function fetchProducts(): Promise<Product[]> {
  const rows = check(await supabase.from('products').select('*').order('name'));
  return (rows as ProductRow[]).map(toProduct);
}

/** Anonymised open reports for check 4 and community alerts (no reporter identity or photos). */
export async function fetchReportSignals(): Promise<Report[]> {
  const rows = check(await supabase.rpc('report_signals'));
  return (rows as ReportRow[]).map(toReport);
}

/** Full reports — row-level security returns everything for admins, own reports otherwise. */
export async function fetchReports(): Promise<Report[]> {
  const rows = check(await supabase.from('reports').select('*').order('created_at', { ascending: false }));
  return (rows as ReportRow[]).map(toReport);
}

export interface NewReport {
  productName: string;
  productKey: string;
  barcode?: string;
  nafdacNumber?: string;
  expiryDate?: string;
  storeLocation: string;
  observedAt?: string;
  labelDescription: string;
  analysisResult?: string;
}

/** Evidence Submission Module: uploads the photo, then files the report. */
export async function uploadEvidence(userId: string, photo: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  check(await supabase.storage.from('evidence').upload(path, photo, { contentType: 'image/jpeg' }));
  return path;
}

export async function createReport(userId: string, report: NewReport, photoPath: string): Promise<string> {
  const row = check(
    await supabase
      .from('reports')
      .insert({
        user_id: userId,
        product_name: report.productName,
        product_key: report.productKey,
        barcode: report.barcode || null,
        nafdac_number: report.nafdacNumber || null,
        expiry_date: report.expiryDate || null,
        store_location: report.storeLocation,
        observed_at: report.observedAt ? new Date(report.observedAt).toISOString() : new Date().toISOString(),
        label_description: report.labelDescription,
        photo_path: photoPath,
        analysis_result: report.analysisResult || null,
        status: 'Pending',
      })
      .select('id')
      .single()
  );
  return (row as unknown as { id: string }).id;
}

/** Report Management Module. */
export async function reviewReport(id: string, status: ReportStatus, actionNote: string) {
  check(
    await supabase
      .from('reports')
      .update({ status, action_note: actionNote || null, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .single()
  );
}

export async function evidenceUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('evidence').createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function addProduct(p: Omit<Product, 'id' | 'source'>) {
  check(
    await supabase
      .from('products')
      .insert({
        name: p.name,
        brand: p.brand || null,
        category: p.category || null,
        size: p.size || null,
        manufacturer: p.manufacturer || null,
        barcode: p.barcode || null,
        nafdac_number: p.nafdacNumber || null,
        expiry_date: p.expiryDate || null,
      })
      .select('id')
      .single()
  );
}
