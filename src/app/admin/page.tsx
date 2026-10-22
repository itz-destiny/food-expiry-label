'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell, PageIntro, Reveal } from '@/components/motion';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAuth } from '@/components/auth-provider';

/** Admin/Regulator Dashboard. */
export default function AdminPage() {
  const { user, isAdmin, loading: isUserLoading } = useAuth();

  return (
    <PageShell>
      <PageIntro eyebrow="Admin · Regulator" title="Report management dashboard." highlight={['dashboard.']}>
        Review consumer evidence, update report status, record actions and manage the product registry.
      </PageIntro>

      {isUserLoading ? (
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-surface" />
          ))}
        </div>
      ) : !user ? (
        <Reveal immediate delay={0.3}>
          <div className="mt-10 max-w-md panel p-8">
            <p className="font-headline text-lg font-semibold">Restricted area</p>
            <p className="mt-1 text-sm text-muted-foreground">Log in with an administrator or regulator account.</p>
            <Button asChild className="mt-6 w-full rounded-xl">
              <Link href="/login?next=/admin">
                <LogIn /> Log in
              </Link>
            </Button>
          </div>
        </Reveal>
      ) : !isAdmin ? (
        <Reveal immediate delay={0.3}>
          <div className="mt-10 max-w-lg panel p-8">
            <p className="font-headline text-lg font-semibold">This account isn&apos;t an administrator</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email}. An existing admin (or the Supabase dashboard) has to set this account&apos;s role to
              &quot;admin&quot; in the profiles table.
            </p>
          </div>
        </Reveal>
      ) : (
        <AdminDashboard />
      )}
    </PageShell>
  );
}
