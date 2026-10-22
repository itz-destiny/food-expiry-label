'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AtSign, CircleCheck, CircleX, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageShell, Reveal, SplitWords } from '@/components/motion';
import { supabase } from '@/lib/supabase';

function friendlyError(err: { code?: string; message: string }): string {
  const code = err.code ?? '';
  if (code === 'invalid_credentials') return 'That email and password don’t match an account.';
  if (code === 'email_not_confirmed') return 'Confirm your email first — check your inbox for the link.';
  if (code === 'user_already_exists') return 'An account with this email already exists. Log in instead.';
  if (code === 'weak_password') return 'Use a stronger password of at least 6 characters.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') return 'Too many attempts. Wait a moment and try again.';
  return err.message || 'Something went wrong. Please try again.';
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    // The profile row is created by a database trigger on sign-up.
    const { data, error: authError } = isSignup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(friendlyError(authError));
      return;
    }
    if (isSignup && !data.session) {
      // Email confirmation is on: no session until the link is clicked.
      setCheckEmail(true);
      return;
    }
    // Only follow same-site relative paths.
    router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/verify');
  };

  return (
    <PageShell className="grid min-h-[calc(100vh-120px)] place-items-center">
      <div className="w-full max-w-md">
        <Reveal immediate className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg border-[1.5px] border-foreground bg-accent text-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
        </Reveal>
        <SplitWords
          as="h1"
          text={isSignup ? 'Create your account' : 'Welcome back'}
          highlight={['account', 'back']}
          className="mt-5 text-center text-4xl font-extrabold"
        />
        <Reveal immediate delay={0.2}>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isSignup ? 'Needed to submit evidence reports. Verifying products is open to everyone.' : 'Log in to submit reports or open the dashboard.'}
          </p>
        </Reveal>

        <Reveal immediate delay={0.3}>
          <form onSubmit={submit} className="mt-8 space-y-4 panel p-6">
            {checkEmail && (
              <p className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> Account created. Check {email} for a confirmation link, then log in.
              </p>
            )}
            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <CircleX className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 rounded-xl pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl pl-10" required minLength={6} />
              </div>
            </div>
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-xl pl-10" required />
                </div>
              </div>
            )}
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl font-semibold">
              {loading && <LoaderCircle className="animate-spin" />}
              {isSignup ? 'Create account' : 'Log in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? 'Already have an account? ' : 'New here? '}
              <Link href={`${isSignup ? '/login' : '/signup'}${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-primary hover:underline">
                {isSignup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
          </form>
        </Reveal>
      </div>
    </PageShell>
  );
}
