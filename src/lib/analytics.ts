import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/* Session id — groups events from the same browser tab/session        */
/* ------------------------------------------------------------------ */

const SESSION_KEY = 'kgp_session_id';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage unavailable (privacy mode, SSR, etc) — fall back to
    // a per-call random id; sessions just won't be grouped in that case.
    return crypto.randomUUID();
  }
}

/**
 * "Trực tiếp" (direct) vs "Trang khác" (referral): direct means no
 * referrer at all, OR the referrer is our own domain (in-site
 * navigation isn't a new "visit source"). Anything else — Google,
 * Facebook, another site's link, etc — counts as referral traffic.
 * For referral views we also keep the full referrer URL so the
 * dashboard can break traffic down by specific source.
 */
function getReferrerInfo(): { type: 'direct' | 'referral'; url: string | null } {
  try {
    const ref = document.referrer;
    if (!ref) return { type: 'direct', url: null };
    const refHost = new URL(ref).hostname;
    if (refHost === window.location.hostname) return { type: 'direct', url: null };
    return { type: 'referral', url: ref.slice(0, 2048) };
  } catch {
    return { type: 'direct', url: null };
  }
}

/**
 * Every page view — regardless of whether the person arrived via a
 * shared link, a search engine, or clicked around the site — fires this
 * on every route change (see `useAnalyticsTracking` in
 * `src/hooks/useAnalyticsTracking.ts`, wired up in MainLayout).
 *
 * Fire-and-forget: never blocks rendering, never throws into the UI.
 * No-ops entirely if Supabase isn't configured (see `src/lib/supabase.ts`).
 */
export function trackPageView(path: string): void {
  if (!supabase) return;
  // Don't track visits to the admin dashboard itself — keeps its own
  // traffic out of "trang được truy cập nhiều nhất" noise.
  if (path.startsWith('/thong-ke')) return;

  const referrer = getReferrerInfo();
  void supabase
    .from('page_views')
    .insert({
      path,
      referrer_type: referrer.type,
      referrer_url: referrer.url,
      session_id: getSessionId(),
    })
    .then(({ error }) => {
      // Fire-and-forget on purpose (never blocks rendering), but a
      // silent failure here means the /thong-ke dashboard just never
      // moves with zero explanation — log it so that's debuggable.
      if (error) console.error('[analytics] trackPageView failed:', error);
    });
}

interface MovieViewInput {
  slug: string;
  name: string;
  categories?: { name: string; slug: string }[];
  countries?: { name: string; slug: string }[];
}

/**
 * One row per movie the person opens (detail page or watch page) — but
 * only once per browser session per movie, even if they revisit the
 * page, refresh, or the query refetches in the background. Dedup key
 * lives in sessionStorage so it also survives a full page reload.
 */
export function trackMovieView(movie: MovieViewInput): void {
  if (!supabase) return;

  const dedupeKey = 'kgp_tracked_movies';
  try {
    const tracked: string[] = JSON.parse(sessionStorage.getItem(dedupeKey) ?? '[]');
    if (tracked.includes(movie.slug)) return;
    sessionStorage.setItem(dedupeKey, JSON.stringify([...tracked, movie.slug]));
  } catch {
    // sessionStorage unavailable — fall through and track anyway rather
    // than silently dropping the event.
  }

  void supabase
    .from('movie_views')
    .insert({
      movie_slug: movie.slug,
      movie_name: movie.name,
      categories: (movie.categories ?? []).map((c) => c.name),
      countries: (movie.countries ?? []).map((c) => c.name),
      session_id: getSessionId(),
    })
    .then(({ error }) => {
      if (error) console.error('[analytics] trackMovieView failed:', error);
    });
}