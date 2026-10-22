'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { LogIn, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';

export function Header() {
  const { user, loading: isUserLoading } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12));

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b-2 transition-colors duration-300',
        scrolled || open ? 'border-foreground bg-background' : 'border-transparent bg-background/0'
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6'
        )}
      >
        <Link href="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-accent">
            <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
          </span>
          <span className="font-headline text-lg font-black uppercase tracking-tight">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative px-3.5 py-2 text-sm font-semibold transition-colors',
                isActive(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-3 -bottom-0.5 h-[3px] bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthButtons user={!!user} loading={isUserLoading} onLogout={() => supabase.auth.signOut()} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-6xl border-t p-2 md:hidden"
          >
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-xl px-4 py-3 text-sm font-medium',
                  isActive(item.href) ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t p-2">
              <AuthButtons
                user={!!user}
                loading={isUserLoading}
                onLogout={() => {
                  setOpen(false);
                  void supabase.auth.signOut();
                }}
                onNavigate={() => setOpen(false)}
                full
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function AuthButtons({
  user,
  loading,
  onLogout,
  onNavigate,
  full,
}: {
  user: boolean;
  loading: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  full?: boolean;
}) {
  if (loading) return <div className="h-9 w-24 animate-pulse rounded-xl bg-secondary" />;
  if (user) {
    return (
      <Button variant="outline" size="sm" className={cn('rounded-xl', full && 'w-full')} onClick={onLogout}>
        <LogOut /> Log out
      </Button>
    );
  }
  return (
    <div className={cn('flex gap-2', full && 'flex-col')}>
      <Button asChild variant="ghost" size="sm" className="rounded-xl">
        <Link href="/login" onClick={onNavigate}>
          <LogIn /> Log in
        </Link>
      </Button>
      <Button asChild size="sm" className="rounded-xl font-semibold">
        <Link href="/signup" onClick={onNavigate}>
          Sign up
        </Link>
      </Button>
    </div>
  );
}
