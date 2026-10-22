'use client';

import { motion } from 'motion/react';
import {
  BookOpen,
  ClipboardCheck,
  Database,
  ImagePlus,
  LayoutDashboard,
  ScanBarcode,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';

const MODULES: { icon: LucideIcon; title: string; body: string; className: string; visual?: React.ReactNode }[] = [
  {
    icon: ScanBarcode,
    title: 'Search & barcode scanning',
    body: 'Type a name or NAFDAC number, or scan the barcode with your phone camera.',
    className: 'md:col-span-3',
    visual: <ScanVisual />,
  },
  {
    icon: Database,
    title: 'Product retrieval',
    body: 'Matches by barcode, registration number or name and pulls the full record.',
    className: 'md:col-span-3',
    visual: <RowsVisual />,
  },
  {
    icon: ShieldCheck,
    title: 'Intelligent verification',
    body: 'Four checks combine into one verdict: valid, near expiry, invalid, not found or suspicious.',
    className: 'md:col-span-2',
    visual: <VerdictVisual />,
  },
  {
    icon: ImagePlus,
    title: 'Evidence submission',
    body: 'Photos, location, date and a description, with AI analysis of the label image.',
    className: 'md:col-span-2',
  },
  {
    icon: ClipboardCheck,
    title: 'Report management',
    body: 'Regulators review evidence, update status and record the action taken.',
    className: 'md:col-span-2',
  },
  {
    icon: LayoutDashboard,
    title: 'Admin / regulator dashboard',
    body: 'Live report queue, trends, evidence viewer and product-registry management in one place.',
    className: 'md:col-span-3',
  },
  {
    icon: BookOpen,
    title: 'Consumer awareness',
    body: 'Food-safety tips and alerts for products that regulators have confirmed as suspicious.',
    className: 'md:col-span-3',
  },
];

export function Modules() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="eyebrow">How the system fits together</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-[0.95] sm:text-5xl">
          From the shop shelf to the <span className="mark">regulator&apos;s desk</span>.
        </h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-4 md:grid-cols-6">
        {MODULES.map(({ icon: Icon, title, body, className, visual }) => (
          <StaggerItem
            key={title}
            className={cn('panel-ink panel-ink-hover relative overflow-hidden p-6', className)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent text-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            {visual && <div className="mt-5">{visual}</div>}
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function ScanVisual() {
  return (
    <div className="relative h-16 overflow-hidden rounded-xl border bg-background/60">
      <div className="flex h-full items-center justify-center gap-[3px] px-6">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} className="h-9 bg-foreground/70" style={{ width: (i * 7) % 3 + 1 }} />
        ))}
      </div>
      <motion.span
        className="absolute inset-y-2 w-0.5 bg-primary"
        animate={{ left: ['8%', '92%', '8%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function RowsVisual() {
  const rows = ['Name', 'Barcode', 'NAFDAC no.', 'Reports'];
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={r}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-1.5 text-xs"
        >
          <span className="text-muted-foreground">{r}</span>
          <span className="h-1.5 w-16 rounded-full bg-primary/40" />
        </motion.div>
      ))}
    </div>
  );
}

function VerdictVisual() {
  const verdicts = [
    ['Valid', 'bg-success/15 text-success'],
    ['Near expiry', 'bg-warning/15 text-warning'],
    ['Not found', 'bg-warning/15 text-warning'],
    ['Invalid', 'bg-destructive/15 text-destructive'],
    ['Suspicious', 'bg-destructive/15 text-destructive'],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {verdicts.map(([v, cls], i) => (
        <motion.span
          key={v}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 + i * 0.08 }}
          className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', cls)}
        >
          {v}
        </motion.span>
      ))}
    </div>
  );
}
