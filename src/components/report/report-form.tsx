'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  CircleCheck,
  CircleX,
  ImagePlus,
  LoaderCircle,
  LogIn,
  MapPin,
  Package,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageIntro, Reveal } from '@/components/motion';
import { useAuth } from '@/components/auth-provider';
import { createReport, uploadEvidence } from '@/lib/data';
import { analyzeLabelAction } from '@/app/actions';
import { compressImage } from '@/lib/image';
import { normalizeNafdac, productKey } from '@/lib/verification';
import { cn } from '@/lib/utils';

type Phase =
  | { kind: 'idle' }
  | { kind: 'working'; step: number }
  | { kind: 'done'; reportId: string; analysis: string | null }
  | { kind: 'error'; message: string };

/** Evidence Submission Module. */
export function ReportForm() {
  const params = useSearchParams();
  const { user, loading: isUserLoading } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch {
      setPhase({ kind: 'error', message: 'That image could not be read. Try a JPEG or PNG photo.' });
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (!photo) {
      setPhase({ kind: 'error', message: 'Add a photo of the product or label as evidence.' });
      return;
    }
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setPhase({ kind: 'working', step: 0 });

    try {
      const photoPath = await uploadEvidence(user.id, await (await fetch(photo)).blob());

      setPhase({ kind: 'working', step: 1 });
      // The AI analysis is a bonus — the report is filed even if it fails.
      const ai = await analyzeLabelAction(photo).catch(() => ({ analysisResult: '', error: 'unavailable' }));
      const analysis = ai.error ? null : ai.analysisResult;

      setPhase({ kind: 'working', step: 2 });
      const reportId = await createReport(
        user.id,
        {
          productName: data.productName.trim(),
          productKey: productKey(data.productName),
          barcode: data.barcode?.trim(),
          nafdacNumber: normalizeNafdac(data.nafdacNumber),
          expiryDate: data.expiryDate,
          storeLocation: data.storeLocation.trim(),
          observedAt: data.observedAt,
          labelDescription: data.labelDescription.trim(),
          analysisResult: analysis ?? undefined,
        },
        photoPath
      );

      formRef.current?.reset();
      setPhoto(null);
      if (fileRef.current) fileRef.current.value = '';
      setPhase({ kind: 'done', reportId, analysis });
    } catch (err) {
      setPhase({
        kind: 'error',
        message: err instanceof Error ? err.message : 'The report could not be saved. Please try again.',
      });
    }
  };

  const busy = phase.kind === 'working';

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
      <div>
        <PageIntro eyebrow="Evidence submission" title="Report a suspicious product." highlight={['suspicious']}>
          Photos plus where and when you saw it give regulators what they need to act. Your report also warns the next
          shopper who checks this product.
        </PageIntro>

        <Reveal immediate delay={0.35}>
          {isUserLoading ? (
            <div className="mt-8 h-[560px] animate-pulse rounded-3xl bg-surface" />
          ) : !user ? (
            <div className="mt-8 panel p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent text-foreground">
                <LogIn className="h-6 w-6" />
              </span>
              <p className="mt-4 font-headline text-lg font-semibold">Log in to submit evidence</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reports are tied to an account so regulators can follow up. Verifying products doesn&apos;t need one.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button asChild className="rounded-xl">
                  <Link href="/login?next=/report">Log in</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} className="mt-8 space-y-5 panel-ink p-5 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product name</Label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="productName"
                    name="productName"
                    defaultValue={params.get('product') ?? ''}
                    placeholder="e.g. Tropika Orange Juice 1L"
                    className="h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" name="barcode" inputMode="numeric" defaultValue={params.get('barcode') ?? ''} placeholder="Optional" className="h-11 rounded-xl font-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nafdacNumber">NAFDAC no.</Label>
                  <Input id="nafdacNumber" name="nafdacNumber" defaultValue={params.get('nafdac') ?? ''} placeholder="As printed" className="h-11 rounded-xl font-code uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry on label</Label>
                  <Input id="expiryDate" name="expiryDate" type="date" defaultValue={params.get('expiry') ?? ''} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeLocation">Where you saw it</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="storeLocation" name="storeLocation" placeholder="Store, market or area" className="h-11 rounded-xl pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observedAt">Date and time</Label>
                  <Input id="observedAt" name="observedAt" type="datetime-local" className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labelDescription">What looks wrong?</Label>
                <Textarea
                  id="labelDescription"
                  name="labelDescription"
                  rows={4}
                  placeholder="e.g. The expiry date is printed on a sticker over an older date, and there is no NAFDAC number."
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Photo evidence</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
                {photo ? (
                  <div className="relative overflow-hidden rounded-2xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data URI preview */}
                    <img src={photo} alt="Evidence preview" className="max-h-72 w-full object-contain bg-secondary" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="Remove photo"
                      className="absolute right-3 top-3 rounded-full"
                      onClick={() => {
                        setPhoto(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    <ImagePlus className="h-7 w-7" />
                    Add a clear photo of the label or pack
                  </button>
                )}
              </div>

              <Button type="submit" size="lg" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold">
                {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
                {busy ? 'Submitting…' : 'Submit report'}
              </Button>
            </form>
          )}
        </Reveal>
      </div>

      <div className="lg:pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase.kind}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
          >
            <StatusPanel phase={phase} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusPanel({ phase }: { phase: Phase }) {
  if (phase.kind === 'error') {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6">
        <p className="flex items-center gap-2 font-semibold text-destructive">
          <CircleX className="h-5 w-5" /> Couldn&apos;t submit
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{phase.message}</p>
      </div>
    );
  }
  if (phase.kind === 'working') {
    return (
      <div className="space-y-3">
        {['Uploading photo evidence', 'AI is analysing the label photo', 'Filing the report'].map((label, i) => (
          <div key={label} className={cn('flex items-center gap-3 panel p-4 text-sm', i > phase.step && 'opacity-40')}>
            {i < phase.step ? (
              <CircleCheck className="h-4 w-4 text-success" />
            ) : i === phase.step ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="h-4 w-4 rounded-full border-2" />
            )}
            {label}
          </div>
        ))}
      </div>
    );
  }
  if (phase.kind === 'done') {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-success/30 bg-success/10 p-6">
          <p className="flex items-center gap-2 font-semibold text-success">
            <CircleCheck className="h-5 w-5" /> Report submitted
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            It&apos;s now in the regulator queue as <strong className="text-foreground">Pending</strong>, and the product will show as
            reported when others verify it.
          </p>
          <p className="mt-3 font-code text-xs text-muted-foreground">Ref {phase.reportId}</p>
        </div>
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> AI label analysis
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {phase.analysis ?? 'The AI analysis is unavailable right now. Your report was still saved and will be reviewed.'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-dashed p-6">
      <p className="font-headline font-semibold">What makes a strong report</p>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {[
          'A sharp photo where the expiry date and NAFDAC number are readable',
          'The exact store or market, so inspectors can find the batch',
          'What you noticed: stickers over dates, smudged print, missing numbers, damaged seals',
          'The barcode digits, if the pack has one',
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
