/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TMDB_API_KEY: string;
  readonly VITE_TMDB_BASE_URL: string;
  readonly VITE_TMDB_IMAGE_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  /** Shared passphrase gating /thong-ke — see StatsPasswordGate.tsx. */
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Supabase project URL, used by the /thong-ke analytics dashboard. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key — safe to expose client-side (paired with RLS policies). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
