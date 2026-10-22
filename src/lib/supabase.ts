import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add them to .env.local.');
}

/** Browser Supabase client. Row-level security decides what each user can read or write. */
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
