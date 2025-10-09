import Link from 'next/link';
import { Button } from './ui/button';
import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="py-3 px-4 bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:animate-pulse" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold text-foreground">Food Expiry Alert</h1>
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
