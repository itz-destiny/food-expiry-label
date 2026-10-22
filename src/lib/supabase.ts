import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False when the deployment is missing the Supabase env vars. */
export const isSupabaseConfigured = Boolean(url && key);

export const NOT_CONFIGURED_MESSAGE =
  'Supabase isn’t configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (in .env.local, or in the Vercel project settings) and redeploy.';

/**
 * Browser Supabase client. Row-level security decides what each user can read
 * or write. Without env vars it points at a placeholder so the app still builds
 * and pages can explain what's missing instead of crashing.
 */
export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: { persistSession: isSupabaseConfigured, autoRefreshToken: isSupabaseConfigured },
});

export function requireSupabase() {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
}
