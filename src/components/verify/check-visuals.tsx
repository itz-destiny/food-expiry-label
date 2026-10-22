import { CalendarClock, CircleAlert, CircleCheck, CircleX, Database, Flag, Hash } from 'lucide-react';
import type { CheckId, CheckStatus, Verdict } from '@/lib/verification';

export const CHECK_ICONS: Record<CheckId, typeof CalendarClock> = {
  expiry: CalendarClock,
  database: Database,
  nafdac: Hash,
  reports: Flag,
};

export const STATUS_ICONS: Record<CheckStatus, typeof CircleCheck> = {
  pass: CircleCheck,
  warn: CircleAlert,
  fail: CircleX,
};

/** Tailwind classes per outcome: text colour, tinted surface and ring. */
export const STATUS_TONE: Record<CheckStatus, { text: string; bg: string; ring: string; label: string }> = {
  pass: { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/30', label: 'Pass' },
  warn: { text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/30', label: 'Caution' },
  fail: { text: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/30', label: 'Fail' },
};

export const VERDICT_TONE: Record<Verdict, CheckStatus> = {
  valid: 'pass',
  'near-expiry': 'warn',
  'not-found': 'warn',
  invalid: 'fail',
  suspicious: 'fail',
};
