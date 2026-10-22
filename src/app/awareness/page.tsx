import { PageShell, PageIntro, Reveal, Stagger, StaggerItem } from '@/components/motion';
import { CommunityAlerts } from '@/components/awareness/community-alerts';
import { CalendarClock, Eye, Hash, PackageSearch, Siren, Thermometer } from 'lucide-react';

export const metadata = { title: 'Food-safety awareness — LabelCheck' };

const TIPS = [
  {
    icon: CalendarClock,
    title: 'Use-by vs best-before',
    body: '“Use by” / “Expiry” is about safety — never eat food after it. “Best before” is about quality; the food may be safe after, but check smell, look and packaging.',
  },
  {
    icon: Hash,
    title: 'Look for the NAFDAC number',
    body: 'Registered processed foods display a NAFDAC registration number, usually like A1-1234 or 01-1234. No number, or one that looks altered, is a red flag.',
  },
  {
    icon: Eye,
    title: 'Spot tampered dates',
    body: 'Stickers over printed dates, smudged or re-stamped digits, or a date in a different font from the rest of the label can mean the date was changed.',
  },
  {
    icon: PackageSearch,
    title: 'Check the pack itself',
    body: 'Avoid bulging or dented cans, broken seals, torn sachets, leaking bottles and products with faded or blurry labels.',
  },
  {
    icon: Thermometer,
    title: 'Store it right',
    body: 'Expiry dates assume correct storage. Keep chilled foods cold, dry foods dry and sealed, and follow “once opened” instructions on the label.',
  },
  {
    icon: Siren,
    title: 'If something is wrong',
    body: 'Don’t buy or eat it. Take a photo of the label, note the store and time, and report it here so others are warned and regulators can act.',
  },
];

/** Consumer Awareness Module. */
export default function AwarenessPage() {
  return (
    <PageShell>
      <PageIntro eyebrow="Consumer awareness" title="Know what a safe label looks like." highlight={['safe', 'label']}>
        Practical food-safety guidance, plus live alerts for products that regulators have confirmed as suspicious.
      </PageIntro>

      <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPS.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title} className="group relative overflow-hidden panel p-6">
            <span className="grid h-11 w-11 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent text-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="mt-20">
        <p className="eyebrow">Community alerts</p>
        <h2 className="mt-3 text-3xl font-black uppercase sm:text-4xl">Confirmed suspicious products</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Products appear here once an administrator has reviewed consumer evidence and confirmed the report.
        </p>
      </Reveal>
      <CommunityAlerts />
    </PageShell>
  );
}
