'use client';

import { motion } from 'motion/react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Flat ink-bodied phone with a hard yellow offset shadow. Used once, in the hero. */
export function PhoneFrame({ children, className, float = false }: { children: React.ReactNode; className?: string; float?: boolean }) {
  return (
    <motion.div
      className={cn('relative w-[280px] sm:w-[292px]', className)}
      animate={float ? { y: [0, -8, 0] } : undefined}
      transition={float ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* side buttons */}
      <span aria-hidden className="absolute -left-[4px] top-28 h-10 w-[4px] rounded-l bg-foreground" />
      <span aria-hidden className="absolute -left-[4px] top-44 h-16 w-[4px] rounded-l bg-foreground" />
      <span aria-hidden className="absolute -right-[4px] top-36 h-20 w-[4px] rounded-r bg-foreground" />

      <div
        className="relative aspect-[9/19.2] rounded-[2.75rem] bg-foreground p-[9px]"
        style={{ boxShadow: '12px 12px 0 0 hsl(var(--accent))' }}
      >
        <div className="relative h-full overflow-hidden rounded-[2.2rem] bg-background">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-7 pt-3 text-[11px] font-semibold">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>
          <div aria-hidden className="absolute left-1/2 top-2.5 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground" />
          <div className="absolute inset-0 pt-11">{children}</div>
          <div aria-hidden className="absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-foreground/70" />
        </div>
      </div>
    </motion.div>
  );
}
