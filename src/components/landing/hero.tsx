'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, SplitWords } from '@/components/motion';
import { PhoneFrame } from './phone';
import { ChecksScreen, ScanScreen, VerdictScreen } from './screens';

type Step = { screen: 'scan' } | { screen: 'checks'; revealed: number } | { screen: 'verdict' };

// Scripted loop: scan → four checks tick in → verdict.
const SCRIPT: { step: Step; ms: number }[] = [
  { step: { screen: 'scan' }, ms: 2600 },
  { step: { screen: 'checks', revealed: 0 }, ms: 700 },
  { step: { screen: 'checks', revealed: 1 }, ms: 650 },
  { step: { screen: 'checks', revealed: 2 }, ms: 650 },
  { step: { screen: 'checks', revealed: 3 }, ms: 650 },
  { step: { screen: 'checks', revealed: 4 }, ms: 1200 },
  { step: { screen: 'verdict' }, ms: 3400 },
];

function HeroPhone() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SCRIPT.length), SCRIPT[index].ms);
    return () => clearTimeout(timer);
  }, [index]);

  const step = SCRIPT[index].step;
  return (
    <PhoneFrame float>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.screen}
          className="h-full"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
        >
          {step.screen === 'scan' && <ScanScreen />}
          {step.screen === 'checks' && <ChecksScreen revealed={step.revealed} />}
          {step.screen === 'verdict' && <VerdictScreen />}
        </motion.div>
      </AnimatePresence>
    </PhoneFrame>
  );
}

const FACTS = [
  ['Checks', '4'],
  ['Verdicts', '5'],
  ['Account to verify', 'None'],
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground">
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:pb-24 lg:pt-36">
        <div>
          <Reveal immediate>
            <span className="eyebrow">Food label verification · consumer awareness</span>
          </Reveal>
          <SplitWords
            text="Is your food label telling the truth?"
            highlight={['truth?', 'truth']}
            className="mt-5 text-[2.6rem] font-black uppercase leading-[0.95] sm:text-6xl lg:text-[4.1rem] xl:text-[4.5rem]"
          />
          <Reveal immediate delay={0.45}>
            <p className="mt-7 max-w-xl text-base text-muted-foreground sm:text-lg">
              Search or scan any packaged food. In seconds we check its expiry date, look it up in the product registry,
              confirm its NAFDAC number and tell you if other shoppers have reported it.
            </p>
          </Reveal>
          <Reveal immediate delay={0.6}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base font-semibold">
                <Link href="/verify">
                  <ScanBarcode /> Verify a product
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-[1.5px] border-foreground px-6 text-base">
                <Link href="/report">
                  Report a suspicious product <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
          {/* A tiny "nutrition facts" strip of product facts. */}
          <Reveal immediate delay={0.75}>
            <dl className="mt-10 grid max-w-md grid-cols-3 border-y-[3px] border-foreground">
              {FACTS.map(([k, v], i) => (
                <div key={k} className={i > 0 ? 'border-l border-foreground px-4 py-3' : 'py-3 pr-4'}>
                  <dt className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                  <dd className="font-headline text-2xl font-black">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal immediate delay={0.3} className="relative flex justify-center lg:justify-end">
          <div className="relative">
            {/* Price-sticker card behind the phone */}
            <div
              aria-hidden
              className="absolute -left-12 top-16 hidden h-[70%] w-[120%] -rotate-6 rounded-3xl border-[3px] border-foreground bg-primary sm:block"
            />
            <div className="relative">
              <HeroPhone />
            </div>
            {/* Rubber stamp sticker */}
            <motion.div
              initial={{ scale: 1.6, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: -14 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 300, damping: 16 }}
              className="absolute -left-20 bottom-24 hidden h-24 w-24 place-items-center rounded-full border-[3px] border-destructive bg-background text-center font-headline text-[11px] font-black uppercase leading-tight tracking-widest text-destructive sm:grid"
            >
              Check
              <br />
              before
              <br />
              you buy
            </motion.div>
            <p className="mt-8 text-center font-code text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Illustrative demo
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
