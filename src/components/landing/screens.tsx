'use client';

import { motion } from 'motion/react';
import { CalendarClock, CircleCheck, Database, Flag, Hash, ScanBarcode, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Illustrative demo content only — not real products or reports.
const spring = { type: 'spring', stiffness: 380, damping: 28 } as const;

function ScreenHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-5 pb-3 pt-2">
      <p className="font-code text-[9px] uppercase tracking-[0.2em] text-primary">{sub}</p>
      <p className="mt-0.5 font-headline text-base font-bold">{title}</p>
    </div>
  );
}

function Barcode({ className }: { className?: string }) {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2];
  return (
    <div className={cn('flex h-10 items-stretch gap-[2px]', className)} aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="bg-zinc-900" style={{ width: w * 1.6 }} />
      ))}
    </div>
  );
}

/** A food pack with a label, shared by several screens. */
function Pack({ expiry = 'EXP 14/03/2027', nafdac = 'NAFDAC REG NO. A8-0005', highlight }: { expiry?: string; nafdac?: string; highlight?: 'expiry' | 'nafdac' | 'barcode' }) {
  const ring = 'rounded ring-2 ring-primary ring-offset-2 ring-offset-amber-50';
  return (
    <div className="mx-auto w-[200px] rounded-2xl border-2 border-foreground bg-orange-500 p-3">
      <p className="font-headline text-sm font-extrabold text-white">Tropika</p>
      <p className="text-[10px] font-medium text-white/90">Orange Juice · 1 L</p>
      <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-zinc-900">
        <p className={cn('font-code text-[10px] font-bold', highlight === 'expiry' && ring)}>{expiry}</p>
        <p className={cn('mt-1 font-code text-[9px]', highlight === 'nafdac' && ring)}>{nafdac}</p>
        <div className={cn('mt-2', highlight === 'barcode' && ring)}>
          <Barcode />
          <p className="mt-0.5 text-center font-code text-[8px] tracking-widest">6 150000 000055</p>
        </div>
      </div>
    </div>
  );
}

export function ScanScreen() {
  return (
    <div className="h-full">
      <ScreenHeader sub="Scan" title="Point at the barcode" />
      <div className="relative mx-4 overflow-hidden rounded-3xl border bg-secondary py-8">
        <Pack highlight="barcode" />
        <motion.div
          className="absolute inset-x-6 h-0.5 bg-primary"
          initial={{ top: '20%' }}
          animate={{ top: ['20%', '80%', '20%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-primary/60" />
      </div>
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl border bg-card p-3 text-xs">
        <ScanBarcode className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Reading barcode…</span>
      </div>
    </div>
  );
}

const DEMO_CHECKS = [
  { icon: CalendarClock, q: 'Expiry date valid?', a: 'Valid · 14 Mar 2027', ok: true },
  { icon: Database, q: 'In the database?', a: 'Found in registry', ok: true },
  { icon: Hash, q: 'NAFDAC no. present?', a: 'A8-0005 · matches', ok: true },
  { icon: Flag, q: 'Reported as suspicious?', a: 'No open reports', ok: true },
];

export function ChecksScreen({ revealed = 4 }: { revealed?: number }) {
  return (
    <div className="h-full">
      <ScreenHeader sub="Verifying" title="Tropika Orange Juice" />
      <div className="space-y-2 px-4">
        {DEMO_CHECKS.map((c, i) => {
          const Icon = c.icon;
          const done = i < revealed;
          return (
            <motion.div
              key={c.q}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border bg-surface p-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">{c.q}</p>
                <p className={cn('truncate text-xs font-semibold', done ? 'text-foreground' : 'text-muted-foreground/50')}>
                  {done ? c.a : 'Checking…'}
                </p>
              </div>
              {done ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
                  <CircleCheck className="h-5 w-5 text-success" />
                </motion.span>
              ) : (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function VerdictScreen() {
  return (
    <div className="h-full">
      <ScreenHeader sub="Result" title="Verification complete" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        className="mx-4 rounded-3xl bg-success/15 p-5 ring-1 ring-success/30"
      >
        <ShieldCheck className="h-9 w-9 text-success" />
        <p className="mt-3 font-headline text-xl font-extrabold">Looks good</p>
        <p className="mt-1 text-xs text-muted-foreground">All four checks passed for this pack.</p>
      </motion.div>
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        {['Expiry', 'Registry', 'NAFDAC', 'Reports'].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 + i * 0.07 }}
            className="flex items-center gap-1.5 rounded-xl border bg-surface px-3 py-2 text-[11px] font-medium"
          >
            <CircleCheck className="h-3.5 w-3.5 text-success" /> {label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
