import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Analytics is entirely optional: if the two env vars above aren't set
 * (e.g. running locally without a Supabase project yet), `supabase` is
 * `null` and every tracking call in `src/lib/analytics.ts` becomes a
 * silent no-op instead of throwing. The site works exactly the same
 * either way — you only lose the /thong-ke dashboard's data.
 */
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const isAnalyticsConfigured = !!supabase;

// Loud, one-time console signal on every page load — so "stats aren't
// moving" is diagnosable from the browser console alone, without having
// to dig through Network tab or guess at env var typos.
if (supabase) {
  console.info(
    '[analytics] Supabase configured — tracking is ON. URL:',
    SUPABASE_URL,
  );
} else {
  console.warn(
    '[analytics] Supabase NOT configured — tracking is OFF (page views / movie views will not be recorded).\n' +
      '  VITE_SUPABASE_URL:',
    SUPABASE_URL ? ' set' : ' MISSING',
    '\n  VITE_SUPABASE_ANON_KEY:',
    SUPABASE_ANON_KEY ? ' set' : ' MISSING',
    '\n  → Set both in Vercel Project Settings → Environment Variables, then redeploy ' +
      '(Vite bakes these in at build time — adding them alone does not update an already-built deployment).',
  );
}