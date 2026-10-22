'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { format } from 'date-fns';
import { ArrowRight, Camera, CircleAlert, Flag, Info, LoaderCircle, PackageSearch, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageIntro, Reveal } from '@/components/motion';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { readLabelAction } from '@/app/actions';
import { decodeBarcodeFromImage, isValidGtin } from '@/lib/barcode';
import { compressImage } from '@/lib/image';
import { useRegistry } from '@/hooks/use-registry';
import { searchProducts, verifyProduct, VERDICT_COPY, type VerificationResult } from '@/lib/verification';
import { toDate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CHECK_ICONS, STATUS_ICONS, STATUS_TONE, VERDICT_TONE } from './check-visuals';

const EASE = [0.22, 1, 0.36, 1] as const;

export function VerifyWorkspace() {
  const params = useSearchParams();
  const registry = useRegistry();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [barcode, setBarcode] = useState(params.get('barcode') ?? '');
  const [labelExpiry, setLabelExpiry] = useState('');
  const [labelNafdac, setLabelNafdac] = useState('');
  const [focused, setFocused] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [photo, setPhoto] = useState<{ preview: string; status: 'reading' | 'done' | 'error'; note: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // On phones the results sit below the form: bring them into view.
  useEffect(() => {
    if (!checking && !result) return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [checking, result]);

  const suggestions = useMemo(
    () => (focused && query.length > 1 ? searchProducts(registry.products, query) : []),
    [focused, query, registry.products]
  );

  const runWith = (input: { query: string; barcode: string; labelExpiry: string; labelNafdac: string }) => {
    if (!input.query.trim() && !input.barcode.trim()) return;
    setChecking(true);
    setResult(null);
    // Short pause so the "checking" state registers; the engine itself is instant.
    setTimeout(() => {
      setResult(
        verifyProduct(
          { query: input.query.trim(), barcode: input.barcode.trim(), labelExpiry: input.labelExpiry, labelNafdac: input.labelNafdac },
          registry.products,
          registry.reports
        )
      );
      setChecking(false);
    }, 650);
  };

  const run = (e?: React.FormEvent) => {
    e?.preventDefault();
    runWith({ query, barcode, labelExpiry, labelNafdac });
  };

  /** Verification by photo: decode the barcode locally and let the AI read the printed fields. */
  const onLabelPhoto = async (file?: File) => {
    if (photoRef.current) photoRef.current.value = '';
    if (!file) return;
    let preview: string;
    try {
      preview = await compressImage(file);
    } catch {
      setPhoto({ preview: '', status: 'error', note: 'That file couldn’t be opened as an image. Try a JPEG or PNG photo.' });
      return;
    }
    setPhoto({ preview, status: 'reading', note: 'Reading the label…' });
    setResult(null);

    const [code, ai] = await Promise.all([decodeBarcodeFromImage(file), readLabelAction(preview)]);
    const fields = ai.fields;
    // Prefer the exact barcode decode; accept the AI's reading only if its check digit is valid.
    const aiBarcode = fields?.barcode?.replace(/\D/g, '') ?? '';
    const scannedBarcode = code ?? (isValidGtin(aiBarcode) ? aiBarcode : '');
    const registryMatch = scannedBarcode ? registry.products.find((p) => p.barcode === scannedBarcode) : undefined;
    const next = {
      query: fields?.productName ?? registryMatch?.name ?? query,
      barcode: scannedBarcode || barcode,
      labelExpiry: fields?.expiryDate ?? labelExpiry,
      labelNafdac: fields?.nafdacNumber?.toUpperCase() ?? labelNafdac,
    };
    setQuery(next.query);
    setBarcode(next.barcode);
    setLabelExpiry(next.labelExpiry);
    setLabelNafdac(next.labelNafdac);

    if (!next.query.trim() && !next.barcode.trim()) {
      setPhoto({
        preview,
        status: 'error',
        note: ai.error ?? 'Couldn’t find a product name or barcode in that photo. Try a closer shot of the front and the label.',
      });
      return;
    }
    const found = [
      fields?.productName && 'name',
      scannedBarcode && 'barcode',
      fields?.nafdacNumber && 'NAFDAC number',
      fields?.expiryDate && 'expiry date',
    ].filter(Boolean);
    setPhoto({
      preview,
      status: 'done',
      note: ai.error
        ? `Barcode read, but the AI couldn’t read the rest: ${ai.error}`
        : `Read the ${found.join(', ')} from your photo — check them below.${fields?.notes ? ' ' + fields.notes : ''}`,
    });
    runWith(next);
  };

  const reportHref = result
    ? `/report?${new URLSearchParams({
        product: result.product?.name ?? result.input.query,
        ...(result.input.barcode || result.product?.barcode ? { barcode: result.input.barcode || result.product?.barcode || '' } : {}),
        ...(result.input.labelNafdac ? { nafdac: result.input.labelNafdac } : {}),
        ...(result.input.labelExpiry ? { expiry: result.input.labelExpiry } : {}),
      }).toString()}`
    : '/report';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
      <div>
        <PageIntro eyebrow="Verification engine" title="Check a product before you buy it." highlight={['before', 'buy']}>
          Search by name, NAFDAC number or barcode. Add the expiry date and NAFDAC number printed on the pack and we run
          all four checks.
        </PageIntro>

        <Reveal immediate delay={0.35}>
          <form onSubmit={run} className="mt-8 space-y-5 panel-ink p-5 sm:p-6">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Label photo"
              onChange={(e) => onLabelPhoto(e.target.files?.[0])}
            />
            {photo ? (
              <div className="flex items-start gap-3 rounded-xl border-[1.5px] border-foreground bg-accent/30 p-3">
                {photo.preview && (
                  // eslint-disable-next-line @next/next/no-img-element -- local data URI preview
                  <img src={photo.preview} alt="Label photo" className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold">
                    {photo.status === 'reading' ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : photo.status === 'error' ? (
                      <CircleAlert className="h-4 w-4 text-destructive" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                    {photo.status === 'reading' ? 'Reading your label…' : photo.status === 'error' ? 'Couldn’t read the label' : 'Label read'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{photo.note}</p>
                  {photo.status !== 'reading' && (
                    <button type="button" className="mt-1 text-xs font-semibold underline" onClick={() => photoRef.current?.click()}>
                      Use another photo
                    </button>
                  )}
                </div>
                <button type="button" aria-label="Remove photo" className="text-muted-foreground hover:text-foreground" onClick={() => setPhoto(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-dashed border-foreground p-4 text-left transition-colors hover:bg-accent/30"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent">
                  <Camera className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">Verify from a photo of the label</span>
                  <span className="block text-xs text-muted-foreground">
                    Take or upload a photo — we read the name, barcode, NAFDAC number and expiry date.
                  </span>
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or enter the details <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">Product</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    placeholder="e.g. Tropika Orange Juice"
                    className="h-12 rounded-xl pl-10"
                    autoComplete="off"
                  />
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl"
                      >
                        {suggestions.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setQuery(p.name);
                                if (p.barcode) setBarcode(p.barcode);
                                setFocused(false);
                              }}
                            >
                              <span className="truncate">{p.name}</span>
                              <span className="shrink-0 font-code text-xs text-muted-foreground">{p.size}</span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
                <BarcodeScanner
                  onDetected={(code) => {
                    setBarcode(code);
                    const match = registry.products.find((p) => p.barcode === code);
                    setQuery(match?.name ?? code);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  inputMode="numeric"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Optional"
                  className="h-11 rounded-xl font-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={labelExpiry}
                  onChange={(e) => setLabelExpiry(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nafdac">NAFDAC no.</Label>
                <Input
                  id="nafdac"
                  value={labelNafdac}
                  onChange={(e) => setLabelNafdac(e.target.value.toUpperCase())}
                  placeholder="e.g. A1-1234"
                  className="h-11 rounded-xl font-code"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base font-semibold" disabled={checking || (!query.trim() && !barcode.trim())}>
              {checking ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              {checking ? 'Running checks…' : 'Run the 4 checks'}
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {registry.loading
                ? 'Loading the product registry…'
                : registry.error
                ? `Couldn’t reach the product registry: ${registry.error}`
                : `${registry.products.length} products in the registry. Try "Tropika" or barcode 6150000000051.`}
            </p>
          </form>
        </Reveal>
      </div>

      <div ref={resultsRef} className="min-w-0 scroll-mt-24 lg:pt-24">
        <AnimatePresence mode="wait">
          {checking ? (
            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {['Retrieving product record', 'Validating expiry date', 'Checking NAFDAC number', 'Searching consumer reports'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-center gap-3 panel p-4 text-sm text-muted-foreground"
                >
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> {step}
                </motion.div>
              ))}
            </motion.div>
          ) : result ? (
            <ResultPanel key={`${result.checkedAt.getTime()}`} result={result} reportHref={reportHref} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden min-h-[420px] place-items-center rounded-3xl border border-dashed p-8 text-center lg:grid"
            >
              <div className="max-w-xs">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent text-foreground">
                  <PackageSearch className="h-7 w-7" />
                </span>
                <p className="mt-4 font-headline text-lg font-semibold">Results appear here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expiry date · registry match · NAFDAC number · consumer reports
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Response/Result Module. */
function ResultPanel({ result, reportHref }: { result: VerificationResult; reportHref: string }) {
  const tone = STATUS_TONE[VERDICT_TONE[result.verdict]];
  const VerdictIcon = STATUS_ICONS[VERDICT_TONE[result.verdict]];
  const copy = VERDICT_COPY[result.verdict];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: EASE }}
        className={cn('relative overflow-hidden rounded-3xl border p-6 ring-1', tone.bg, tone.ring)}
      >
        <div className="flex items-start gap-4">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-background/60', tone.text)}>
            <VerdictIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className={cn('eyebrow', tone.text)}>Verdict</p>
            <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{copy.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
            <p className="mt-3 break-words font-code text-xs text-muted-foreground">
              {result.product?.name ?? result.input.query} · checked {format(result.checkedAt, 'd MMM yyyy, HH:mm')}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {result.checks.map((check, i) => {
          const t = STATUS_TONE[check.status];
          const Icon = CHECK_ICONS[check.id];
          const StatusIcon = STATUS_ICONS[check.status];
          return (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.15 + i * 0.1 }}
              className="panel p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" /> Check {i + 1}
                </span>
                <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', t.bg, t.text)}>
                  <StatusIcon className="h-3.5 w-3.5" /> {t.label}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">{check.question}</p>
              <p className={cn('mt-1 font-headline text-lg font-bold', t.text)}>{check.answer}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
            </motion.div>
          );
        })}
      </div>

      {result.matchingReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="panel p-4"
        >
          <p className="text-sm font-semibold">Recent consumer reports</p>
          <ul className="mt-2 divide-y">
            {result.matchingReports.slice(0, 3).map((r) => {
              const date = toDate(r.submissionDate);
              return (
                <li key={r.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted-foreground">{r.storeLocation}</span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">{r.reportStatus}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {date ? `${format(date, 'd MMM yyyy')} — ` : ''}
                    {r.labelDescription}
                  </p>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Button asChild variant={result.verdict === 'valid' ? 'outline' : 'default'} className="h-11 flex-1 rounded-xl font-semibold">
          <Link href={reportHref}>
            <Flag /> Report this product
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-11 flex-1 rounded-xl">
          <Link href="/awareness">
            Food-safety tips <ArrowRight />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
