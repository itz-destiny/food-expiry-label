'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProducts, fetchReportSignals } from '@/lib/data';
import type { Product, Report } from '@/lib/types';

interface RegistryState {
  products: Product[];
  reports: Report[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the product registry and the anonymised open reports that the
 * verification engine needs.
 */
export function useRegistry() {
  const [state, setState] = useState<RegistryState>({ products: [], reports: [], loading: true, error: null });

  const load = useCallback(async () => {
    const [products, reports] = await Promise.allSettled([fetchProducts(), fetchReportSignals()]);
    const failure = [products, reports].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    setState({
      products: products.status === 'fulfilled' ? products.value : [],
      reports: reports.status === 'fulfilled' ? reports.value : [],
      loading: false,
      error: failure ? String(failure.reason?.message ?? failure.reason) : null,
    });
  }, []);

  useEffect(() => {
    // Fetch on mount; setState happens after the awaited reads.
    void load();
  }, [load]);

  return { ...state, reload: load };
}
