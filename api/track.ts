import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* POST /track                                                         */
/* Body: TrackPageViewPayload | TrackMoviePayload (src/api/trackService.ts) */
/*                                                                     */
/* Classifies the raw referrer sent by the browser into one of         */
/* direct | search | social | external (see supabase/schema.sql) and   */
/* forwards to the `track_event` Postgres function.                    */
/*                                                                     */
/* Fire-and-forget from the client's side (sendBeacon / no-catch axios */
/* call) — this handler mirrors that by never returning a loud error   */
/* status; a broken/misconfigured backend should never surface to the  */
/* visitor, it should just silently not record the event.              */
/* ------------------------------------------------------------------ */

const SEARCH_HOSTS = [
  "google.",
  "bing.com",
  "yahoo.",
  "duckduckgo.com",
  "baidu.com",
  "yandex.",
  "coccoc.com",
  "ecosia.org",
];

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "zalo.me",
  "threads.net",
  "linkedin.com",
  "pinterest.com",
  "reddit.com",
];

function classifySource(
  referrer: string | undefined,
  requestHost: string | undefined,
): "direct" | "search" | "social" | "external" {
  if (!referrer) return "direct";

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }

  if (requestHost && host === requestHost.toLowerCase().split(":")[0]) return "direct";
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return "search";
  if (SOCIAL_HOSTS.some((h) => host.includes(h))) return "social";
  return "external";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  // Tracking is best-effort: if Supabase isn't configured, just accept
  // and drop the event rather than erroring back to the browser.
  if (!configured()) {
    res.status(204).end();
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const type = body.type;

  if (type !== "pageview" && type !== "movie") {
    res.status(400).json({ error: "invalid type" });
    return;
  }

  const requestHost = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  const referrer = typeof body.referrer === "string" ? body.referrer : undefined;
  const source = classifySource(referrer, requestHost);

  const params =
    type === "pageview"
      ? {
          p_type: "pageview",
          p_path: typeof body.path === "string" ? body.path : null,
          p_source: source,
          p_referrer: referrer ?? null,
          p_movie_name: null,
          p_movie_slug: null,
          p_genres: [],
          p_countries: [],
        }
      : {
          p_type: "movie",
          p_path: null,
          p_source: source,
          p_referrer: referrer ?? null,
          p_movie_name: typeof body.movie === "string" ? body.movie : null,
          p_movie_slug: typeof body.slug === "string" ? body.slug : null,
          p_genres: Array.isArray(body.genres) ? body.genres : [],
          p_countries: Array.isArray(body.countries) ? body.countries : [],
        };

  try {
    await rpc("track_event", params);
  } catch (err) {
    console.error("[track] failed:", err);
    // Still 204 — never surface a tracking failure to the visitor.
  }

  res.status(204).end();
}
