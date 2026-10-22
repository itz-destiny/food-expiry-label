'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Stagger, StaggerItem } from '@/components/motion';
import { useRegistry } from '@/hooks/use-registry';
import { toDate } from '@/lib/types';

export function CommunityAlerts() {
  const { reports, loading, error } = useRegistry();

  const alerts = useMemo(
    () =>
      reports
        .filter((r) => r.reportStatus === 'Confirmed Suspicious' || r.reportStatus === 'Action Taken')
        .sort((a, b) => (toDate(b.submissionDate)?.getTime() ?? 0) - (toDate(a.submissionDate)?.getTime() ?? 0))
        .slice(0, 9),
    [reports]
  );

  if (loading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-surface" />
        ))}
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-dashed p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            {error ? 'Alerts are unavailable — the database could not be reached.' : 'No confirmed alerts right now.'}
          </p>
        </div>
        <Link href="/verify" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Verify a product <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.map((r) => {
        const date = toDate(r.submissionDate);
        return (
          <StaggerItem key={r.id} className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <ShieldAlert className="h-4 w-4" /> {r.reportStatus}
              </span>
              {date && <span className="font-code text-xs text-muted-foreground">{format(date, 'd MMM yyyy')}</span>}
            </div>
            <p className="mt-3 font-headline font-bold">{r.productName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {r.storeLocation}
            </p>
            {r.actionNote && <p className="mt-3 text-sm text-muted-foreground">{r.actionNote}</p>}
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
