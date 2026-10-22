import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { site } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-headline font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" /> {site.name}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{site.fullName}.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
