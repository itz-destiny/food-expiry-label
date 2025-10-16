'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShieldCheck, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { Skeleton } from './ui/skeleton';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
  }

  return (
    <header className="py-3 px-4 bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:animate-pulse" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold text-foreground">Food Expiry Alert</h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/admin">Admin</Link>
          </Button>
          {isUserLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : user ? (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2" />
              Logout
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">
                  <LogIn className="mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <UserPlus className="mr-2" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
