'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { CalendarClock, CircleCheck, CircleX, Database, Flag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHECK_QUESTIONS } from '@/lib/verification';

// Illustrative walk-through of one pack — not a real product or real reports.
const STEPS = [
  {
    icon: CalendarClock,
    question: CHECK_QUESTIONS.expiry,
    body: 'We read the date from the pack (or the batch record) and flag anything expired, unreadable or within 30 days of expiry.',
    row: 'Expiry date',
    value: '14 Mar 2027',
    note: '143 days left',
    ok: true,
  },
  {
    icon: Database,
    question: CHECK_QUESTIONS.database,
    body: 'Name, barcode or NAFDAC number is matched against the product registry. Unknown products are treated with caution.',
    row: 'In registry',
    value: 'Yes',
    note: 'Matched by barcode',
    ok: true,
  },
  {
    icon: Hash,
    question: CHECK_QUESTIONS.nafdac,
    body: 'The registration number must be present, correctly formatted and match the one on record. A mismatch is a strong sign of a fake.',
    row: 'NAFDAC no.',
    value: 'A8-0050',
    note: 'Record says A8-0005',
    ok: false,
  },
  {
    icon: Flag,
    question: CHECK_QUESTIONS.reports,
    body: 'Open consumer reports and regulator-confirmed cases are pulled in, so one shopper’s warning protects everyone.',
    row: 'Reports',
    value: '2 open',
    note: 'Ikeja · Wuse II',
    ok: false,
  },
];

/** The four checks as a scroll story, told on a nutrition-label style panel. */
export function FourChecks() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2.5, 2.5]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)));
  });

  return (
    <section ref={ref} id="checks" className="relative" style={{ height: `${STEPS.length * 85}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pt-0">
          <div>
            <p className="eyebrow">The four checks</p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-[0.95] sm:text-5xl">
              Every product answers <span className="mark">four questions</span>.
            </h2>

            {/* Mobile: segmented progress + current step only */}
            <div className="mt-5 lg:hidden">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <span key={s.question} className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <motion.span
                      className="block h-full bg-foreground"
                      animate={{ width: i <= active ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </span>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                  <p className="font-headline text-base font-bold">
                    {active + 1}. {STEPS[active].question}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{STEPS[active].body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop: full list with progress line */}
            <div className="relative mt-10 hidden pl-9 lg:block">
              <div className="absolute bottom-2 left-[13px] top-2 w-0.5 bg-border" />
              <motion.div className="absolute left-[13px] top-2 w-0.5 bg-foreground" style={{ height: lineHeight }} />
              <ol className="space-y-6">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = i === active;
                  return (
                    <li key={s.question} className={cn('relative transition-opacity duration-300', isActive ? 'opacity-100' : 'opacity-40')}>
                      <span
                        className={cn(
                          'absolute -left-9 top-0 grid h-7 w-7 place-items-center rounded-full border-2 bg-background font-code text-xs font-bold',
                          isActive ? 'border-foreground bg-accent' : 'border-border'
                        )}
                      >
                        {i + 1}
                      </span>
                      <p className="flex items-center gap-2 font-headline text-xl font-bold">
                        <Icon className="h-5 w-5" /> {s.question}
                      </p>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden text-muted-foreground"
                          >
                            <span className="block pt-2">{s.body}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="flex justify-center">
            <motion.div style={{ rotate }} className="w-full max-w-[400px]">
              <FactsLabel active={active} />
              <p className="mt-10 text-center font-code text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Illustrative example
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactsLabel({ active }: { active: number }) {
  const done = active === STEPS.length - 1;
  return (
    <div className="relative border-[3px] border-foreground bg-card p-4 font-body sm:p-5" style={{ boxShadow: '8px 8px 0 0 hsl(var(--foreground))' }}>
      <p className="font-headline text-[2rem] font-black leading-none sm:text-[2.6rem]">Verification Facts</p>
      <div className="rule mt-2" />
      <div className="flex items-baseline justify-between py-1.5 text-sm">
        <span>Tropika Orange Juice</span>
        <span className="font-semibold">1 L</span>
      </div>
      <div className="rule-thick" />
      <div className="flex justify-between py-1 font-code text-[10px] font-semibold uppercase tracking-wider">
        <span>Check</span>
        <span>Result</span>
      </div>
      <div className="h-1 w-full bg-foreground" />

      <ul>
        {STEPS.map((s, i) => {
          const shown = i <= active;
          const current = i === active;
          return (
            <li key={s.row} className={cn('relative border-b border-foreground py-2 transition-colors', current && 'bg-accent/60')}>
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="text-sm">
                  <strong className="font-headline font-extrabold">{s.row}</strong>{' '}
                  <AnimatePresence>
                    {shown && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-code text-sm">
                        {s.value}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                {shown ? (
                  <motion.span
                    key="mark"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    className={s.ok ? 'text-success' : 'text-destructive'}
                  >
                    {s.ok ? <CircleCheck className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}
                  </motion.span>
                ) : (
                  <span className="font-code text-xs text-muted-foreground">—</span>
                )}
              </div>
              {shown && <p className="px-1 font-code text-[10px] uppercase tracking-wide text-muted-foreground">{s.note}</p>}
            </li>
          );
        })}
      </ul>

      <div className="rule-thick mt-3" />
      <div className="flex items-center justify-between pt-2 text-sm">
        <span className="font-headline font-extrabold">Verdict</span>
        <span className="font-code text-xs text-muted-foreground">{done ? '' : `${active + 1} of 4 checked`}</span>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ scale: 2.2, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
            className="stamp absolute -bottom-6 right-3 border-destructive bg-card text-2xl text-destructive sm:text-3xl"
          >
            Suspicious
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
