'use client';

import { useEffect, useRef } from 'react';
import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  type Variants,
} from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const hidden = { opacity: 0, y: 24, filter: 'blur(8px)' };
const shown = { opacity: 1, y: 0, filter: 'blur(0px)' };

/** Blur-rise reveal. `immediate` animates on mount for above-the-fold content. */
export function Reveal({
  children,
  className,
  delay = 0,
  immediate = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const transition = { duration: 0.7, ease: EASE, delay };
  return immediate ? (
    <motion.div className={className} initial={hidden} animate={shown} transition={transition}>
      {children}
    </motion.div>
  ) : (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={{ once: true, margin: '-80px' }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
};
const staggerChild: Variants = {
  hidden,
  shown: { ...shown, transition: { duration: 0.6, ease: EASE } },
};

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/** Headline that rises in word by word; words in `highlight` get the highlighter mark. */
export function SplitWords({
  text,
  highlight = [],
  className,
  as: Tag = 'h1',
}: {
  text: string;
  highlight?: string[];
  className?: string;
  as?: 'h1' | 'h2';
}) {
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden
          className={cn('inline-block', highlight.includes(word.replace(/[.,]/g, '')) && 'mark')}
          initial={hidden}
          animate={shown}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 * i }}
        >
          {word}
          {i < words.length - 1 && ' '}
        </motion.span>
      ))}
    </Tag>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.2, ease: EASE });
    return () => controls.stop();
  }, [inView, value, count]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

/** Page heading block used by every inner page. */
export function PageIntro({
  eyebrow,
  title,
  highlight,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Reveal immediate>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <SplitWords
        as="h1"
        text={title}
        highlight={highlight}
        className="mt-3 text-4xl font-black uppercase leading-[0.95] sm:text-5xl md:text-6xl"
      />
      {children && (
        <Reveal immediate delay={0.25} className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {children}
        </Reveal>
      )}
    </div>
  );
}

/** Shared page shell; the top padding clears the fixed header. */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative overflow-hidden">
      <div className={cn('relative mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6', className)}>{children}</div>
    </div>
  );
}
