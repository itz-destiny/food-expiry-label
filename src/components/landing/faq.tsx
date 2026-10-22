'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronDown, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion';

const FAQS = [
  {
    q: 'Do I need an account to verify a product?',
    a: 'No. Anyone can search, scan and run the four checks. You only need an account to submit a report, so regulators can follow up on your evidence.',
  },
  {
    q: 'Where does the product information come from?',
    a: 'From the system’s product registry, which administrators manage from the dashboard. Each result tells you whether a record was found and what it contains.',
  },
  {
    q: 'What does “approaching expiry” mean?',
    a: 'The product is still in date but expires within 30 days. It’s fine to buy if you will use it before the date printed on the pack.',
  },
  {
    q: 'What happens after I report a product?',
    a: 'Your evidence goes into the regulator queue as Pending. Administrators review the photos and details, update the status, and record any action taken. Open reports immediately show up for other shoppers who check the same product.',
  },
  {
    q: 'Can a product pass all checks and still be unsafe?',
    a: 'Yes. The checks cover label information only. Always look at the pack itself — swollen cans, broken seals, strange smells or leaks mean you should not eat it.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="eyebrow">Questions</p>
        <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">Good to know</h2>
      </Reveal>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="panel">
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {f.q}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-foreground bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-black uppercase leading-[0.95] sm:text-5xl">
              Check it <span className="mark text-foreground">before</span> it reaches your table.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Four checks, one clear answer. Free for every shopper.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl border-[1.5px] border-foreground bg-accent px-6 text-base font-semibold text-foreground hover:bg-accent/90">
                <Link href="/verify">
                  <ScanBarcode /> Verify a product
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-primary-foreground/60 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href="/awareness">
                  Food-safety tips <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
