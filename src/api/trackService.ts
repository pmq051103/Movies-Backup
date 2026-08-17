import axios from "axios";

/* ------------------------------------------------------------------ */
/* Frontend tracking — fire-and-forget events sent to the Vercel       */
/* serverless functions (api/track.ts + api/stats.ts).                 */
/*                                                                     */
/* Endpoints deliberately avoid the `/api` prefix so the Vite dev proxy */
/* and the vercel.json `/api/*` → phimapi.com rewrite never swallow     */
/* them. In production vercel.json maps `/track` and `/stats` to the    */
/* serverless functions.                                               */
/* ------------------------------------------------------------------ */

const TRACK_ENDPOINT = "/track";
const STATS_ENDPOINT = "/stats";

export interface TrackPageViewPayload {
  type: "pageview";
  path: string;
  referrer: string;
}

export interface TrackMoviePayload {
  type: "movie";
  movie: string;
  slug: string;
  genres: string[];
  countries: string[];
  referrer: string;
}

export interface StatsResponse {
  total: number;
  today: number;
  movieTotal: number;
  bySource: Array<{ name: string; value: number }>;
  byDay: Array<{ day: string; visits: number }>;
  topPaths: Array<{ name: string; value: number }>;
  topMovies: Array<{ name: string; value: number }>;
  topGenres: Array<{ name: string; value: number }>;
  topCountries: Array<{ name: string; value: number }>;
}

function fire(payload: TrackPageViewPayload | TrackMoviePayload): void {
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(TRACK_ENDPOINT, new Blob([JSON.stringify(payload)], {
      type: "application/json",
    }));
    return;
  }
  axios
    .post(TRACK_ENDPOINT, payload, { headers: { "Content-Type": "application/json" } })
    .catch(() => {
      /* tracking is best-effort; never block the UI */
    });
}

export function trackPageView(path: string, referrer: string): void {
  fire({ type: "pageview", path, referrer });
}

export function trackMovieView(opts: {
  movie: string;
  slug: string;
  genres: string[];
  countries: string[];
  referrer: string;
}): void {
  fire({ type: "movie", ...opts });
}

export async function fetchStats(days = 7): Promise<StatsResponse> {
  const { data } = await axios.get<StatsResponse>(STATS_ENDPOINT, { params: { days } });
  return data;
}

export const trackService = {
  trackPageView,
  trackMovieView,
  fetchStats,
};

export default trackService;
