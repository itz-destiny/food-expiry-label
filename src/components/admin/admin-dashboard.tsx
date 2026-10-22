'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { CircleAlert, ClipboardCheck, FileWarning, Hourglass, Image as ImageIcon, MapPin, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { CountUp, Reveal, Stagger, StaggerItem } from '@/components/motion';
import { addProduct, evidenceUrl, fetchReports, reviewReport } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRegistry } from '@/hooks/use-registry';
import { REPORT_STATUSES, toDate, type Report, type ReportStatus } from '@/lib/types';
import { normalizeNafdac, isNafdacFormat } from '@/lib/verification';
import { cn } from '@/lib/utils';

const chartConfig = {
  reports: { label: 'Reports', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-warning/15 text-warning',
  'Under Review': 'bg-chart-4/15 text-chart-4',
  Reviewed: 'bg-chart-4/15 text-chart-4',
  'Confirmed Suspicious': 'bg-destructive/15 text-destructive',
  'Action Taken': 'bg-success/15 text-success',
  Dismissed: 'bg-secondary text-muted-foreground',
};

function StatusBadge({ status }: { status: string }) {
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[status])}>{status}</span>;
}

function permissionHint(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /row-level security|permission|JSON object requested/i.test(msg)
    ? 'Not allowed. This account needs role "admin" in the profiles table.'
    : msg;
}

/** Loads a private evidence photo through a short-lived signed URL. */
function EvidenceImage({ path, className, alt = '' }: { path?: string; className?: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (path) void evidenceUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  if (!path || !url) return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
  return <img src={url} alt={alt} className={className} />;
}

export function AdminDashboard() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = reports === null && !error;

  const load = useCallback(async () => {
    try {
      setReports(await fetchReports());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const stats = useMemo(() => {
    const list = reports ?? [];
    return {
      total: list.length,
      pending: list.filter((r) => r.reportStatus === 'Pending').length,
      confirmed: list.filter((r) => r.reportStatus === 'Confirmed Suspicious').length,
      resolved: list.filter((r) => r.reportStatus === 'Action Taken' || r.reportStatus === 'Dismissed').length,
    };
  }, [reports]);

  const byMonth = useMemo(() => {
    const counts = new Map<string, number>();
    (reports ?? []).forEach((r) => {
      const d = toDate(r.submissionDate);
      if (d) counts.set(format(d, 'yyyy-MM'), (counts.get(format(d, 'yyyy-MM')) ?? 0) + 1);
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { month: format(d, 'MMM'), reports: counts.get(format(d, 'yyyy-MM')) ?? 0 };
    });
  }, [reports]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>();
    (reports ?? []).forEach((r) => counts.set(r.productName, (counts.get(r.productName) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const visible = (reports ?? []).filter((r) => filter === 'all' || r.reportStatus === filter);

  if (error) {
    return (
      <div className="mt-10 rounded-3xl border border-destructive/40 bg-destructive/10 p-6">
        <p className="flex items-center gap-2 font-semibold text-destructive">
          <FileWarning className="h-5 w-5" /> Couldn&apos;t load reports
        </p>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{error}</pre>
      </div>
    );
  }

  const tiles = [
    { label: 'Total reports', value: stats.total, icon: FileWarning },
    { label: 'Pending review', value: stats.pending, icon: Hourglass },
    { label: 'Confirmed suspicious', value: stats.confirmed, icon: ShieldAlert },
    { label: 'Resolved', value: stats.resolved, icon: ClipboardCheck },
  ];

  return (
    <div className="mt-10 space-y-6">
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <StaggerItem key={label} className="panel p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {label} <Icon className="h-4 w-4" />
            </div>
            {isLoading ? (
              <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-secondary" />
            ) : (
              <CountUp value={value} className="mt-2 block font-headline text-4xl font-extrabold" />
            )}
          </StaggerItem>
        ))}
      </Stagger>

      <Tabs defaultValue="reports">
        <TabsList className="h-11 rounded-xl bg-surface p-1">
          <TabsTrigger value="reports" className="rounded-lg px-4">Report queue</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg px-4">Insights</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg px-4">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <Reveal>
            <div className="panel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <p className="font-semibold">Consumer reports</p>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-9 w-48 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {REPORT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />)}
                </div>
              ) : visible.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">No reports{filter !== 'all' ? ` with status “${filter}”` : ' yet'}.</p>
              ) : (
                <ul className="divide-y">
                  {visible.map((r) => {
                    const date = toDate(r.submissionDate);
                    return (
                      <li key={r.id}>
                        <button
                          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50"
                          onClick={() => setSelected(r)}
                        >
                          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-background">
                            <EvidenceImage path={r.photoPath} className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.productName}</span>
                            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" /> {r.storeLocation}
                            </span>
                          </span>
                          <span className="hidden text-xs text-muted-foreground sm:block">{date ? format(date, 'd MMM yyyy') : '—'}</span>
                          <StatusBadge status={r.reportStatus} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Reveal>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="panel p-5 lg:col-span-3">
              <p className="font-semibold">Reports by month</p>
              <ChartContainer config={chartConfig} className="mt-4 min-h-[240px] w-full">
                <BarChart accessibilityLayer data={byMonth}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={28} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="reports" fill="var(--color-reports)" radius={6} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="panel p-5 lg:col-span-2">
              <p className="font-semibold">Most reported products</p>
              {topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No reports yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topProducts.map(([name, count]) => (
                    <li key={name}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{name}</span>
                        <span className="font-code text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / topProducts[0][1]) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductRegistry />
        </TabsContent>
      </Tabs>

      <ReportDialog report={selected} onClose={() => setSelected(null)} onSaved={load} />
    </div>
  );
}

function ReportDialog({ report, onClose, onSaved }: { report: Report | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  // Reset the form whenever a different report is opened.
  if (report && openedFor !== report.id) {
    setOpenedFor(report.id);
    setStatus(report.reportStatus);
    setNote(report.actionNote ?? '');
  }

  const save = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await reviewReport(report.id, status as ReportStatus, note.trim());
      toast({ title: 'Report updated', description: `${report.productName} → ${status}` });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Update failed', description: permissionHint(err) });
    } finally {
      setSaving(false);
    }
  };

  const date = report ? toDate(report.submissionDate) : null;
  const facts = report
    ? [
        ['Location', report.storeLocation],
        ['Seen', toDate(report.observedAt) ? format(toDate(report.observedAt)!, 'd MMM yyyy, HH:mm') : '—'],
        ['Submitted', date ? format(date, 'd MMM yyyy, HH:mm') : '—'],
        ['Expiry on label', report.expiryDate || '—'],
        ['NAFDAC no.', report.nafdacNumber || '—'],
        ['Barcode', report.barcode || '—'],
      ]
    : [];

  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
        {report && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 font-headline text-xl">
                {report.productName} <StatusBadge status={report.reportStatus} />
              </DialogTitle>
            </DialogHeader>

            {report.photoPath ? (
              <div className="grid min-h-32 place-items-center overflow-hidden rounded-2xl border bg-secondary">
                <EvidenceImage path={report.photoPath} alt={`Evidence for ${report.productName}`} className="max-h-80 w-full object-contain" />
              </div>
            ) : (
              <div className="grid h-32 place-items-center rounded-2xl border border-dashed text-sm text-muted-foreground">No photo attached</div>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-2xl border bg-surface p-4 text-sm">
              <p className="text-xs text-muted-foreground">Consumer description</p>
              <p className="mt-1">{report.labelDescription}</p>
            </div>
            {report.analysisResult && (
              <div className="rounded-2xl border bg-surface p-4 text-sm">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-accent" /> AI label analysis
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{report.analysisResult}</p>
              </div>
            )}

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Action taken / note</Label>
                <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Batch removed from shelves after inspection." className="rounded-xl" />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="rounded-xl font-semibold">
              {saving ? 'Saving…' : 'Save review'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductRegistry() {
  const { toast } = useToast();
  const { products, error: registryError, reload } = useRegistry();
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const nafdac = normalizeNafdac(d.nafdacNumber);
    if (nafdac && !isNafdacFormat(nafdac)) {
      toast({ variant: 'destructive', title: 'Check the NAFDAC number', description: 'Expected a format like A1-1234 or 01-1234.' });
      return;
    }
    setSaving(true);
    try {
      await addProduct({
        name: d.name.trim(),
        brand: d.brand.trim(),
        category: d.category.trim(),
        size: d.size.trim(),
        manufacturer: d.manufacturer.trim(),
        barcode: d.barcode.replace(/\D/g, ''),
        nafdacNumber: nafdac,
        expiryDate: d.expiryDate || undefined,
      });
      form.reset();
      toast({ title: 'Product added', description: d.name });
      void reload();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not add product', description: permissionHint(err) });
    } finally {
      setSaving(false);
    }
  };

  const fields: [string, string, string?][] = [
    ['name', 'Product name'],
    ['brand', 'Brand'],
    ['category', 'Category'],
    ['size', 'Size', 'e.g. 500 g'],
    ['manufacturer', 'Manufacturer'],
    ['barcode', 'Barcode'],
    ['nafdacNumber', 'NAFDAC no.', 'A1-1234'],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <form onSubmit={add} className="space-y-3 panel p-5 lg:col-span-2">
        <p className="font-semibold">Add product record</p>
        {fields.map(([name, label, ph]) => (
          <div key={name} className="space-y-1">
            <Label htmlFor={`p-${name}`} className="text-xs">{label}</Label>
            <Input id={`p-${name}`} name={name} placeholder={ph} required={name === 'name'} className="h-10 rounded-xl" />
          </div>
        ))}
        <div className="space-y-1">
          <Label htmlFor="p-expiryDate" className="text-xs">Batch expiry (optional)</Label>
          <Input id="p-expiryDate" name="expiryDate" type="date" className="h-10 rounded-xl" />
        </div>
        <Button type="submit" disabled={saving} className="w-full rounded-xl font-semibold">
          <Plus /> {saving ? 'Adding…' : 'Add to registry'}
        </Button>
      </form>

      <div className="panel lg:col-span-3">
        <div className="border-b p-4">
          <p className="font-semibold">Registry · {products.length} products</p>
          {registryError && (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Couldn&apos;t load the registry: {registryError}
            </p>
          )}
        </div>
        <ul className="max-h-[560px] divide-y overflow-y-auto">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="font-code text-xs text-muted-foreground">
                  {[p.nafdacNumber, p.barcode].filter(Boolean).join(' · ') || 'No identifiers'}
                </span>
              </span>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', p.source === 'sample' ? 'bg-secondary text-muted-foreground' : 'bg-primary/15 text-primary')}>
                {p.source === 'sample' ? 'Sample' : 'Database'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
