import { Hero } from '@/components/landing/hero';
import { FourChecks } from '@/components/landing/four-checks';
import { Modules } from '@/components/landing/modules';
import { Faq, FinalCta } from '@/components/landing/faq';

export default function Home() {
  return (
    <>
      <Hero />
      <FourChecks />
      <Modules />
      <Faq />
      <FinalCta />
    </>
  );
}
