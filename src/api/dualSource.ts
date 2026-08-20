/**
 * Multi-source API layer.
 *
 * Combines phimapi.com (primary — large catalog, robust filters),
 * vsmov.com (secondary — fresher indie Vietnamese titles), and
 * ophim1.com (tertiary — extra catalog + titles the other two haven't
 * picked up yet). Used only on endpoints where merging is safe and
 * paginating gets in the way:
 *   - Latest movies feed (Home) + catalog stats (Home sidebar)
 *   - Search (phimapi + vsmov only — see note on `searchMoviesDual`)
 *   - Movie detail (fallback + episode server merge)
 * List/filter pages stay single-source (phimapi) to keep pagination sane.
 */

import { apiGet } from './axiosClient';
import { vsmovGet } from './vsmovClient';
import { ophimGet } from './ophimClient';
import { rankAndMerge } from '@/utils/searchRank';
import { OPHIM_IMAGE_BASE_URL } from '@/constants';
import type {
  APIListResponse,
  MovieDetailResponse,
  MovieListItem,
  Episode,
} from '@/types';

export type MovieSource = 'phimapi' | 'vsmov' | 'ophim';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

/** Like safe() but retries once after a short delay on failure. */
async function safeRetry<T>(fn: () => Promise<T>, delayMs = 800): Promise<T | null> {
  try {
    return await fn();
  } catch {
    try {
      await new Promise((r) => setTimeout(r, delayMs));
      return await fn();
    } catch {
      return null;
    }
  }
}

function dedupeBySlug(list: MovieListItem[]): MovieListItem[] {
  const seen = new Set<string>();
  const out: MovieListItem[] = [];
  for (const m of list) {
    if (!m?.slug || seen.has(m.slug)) continue;
    seen.add(m.slug);
    out.push(m);
  }
  return out;
}

/**
 * Best-effort MovieListItem extractor — vsmov returns
 * `{ status, items }` while phimapi's home endpoint returns the same.
 * Handles v1 nested shape too (`{ data: { items } }`).
 */
function extractItems(raw: unknown): MovieListItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.items)) return r.items as MovieListItem[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.items)) return d.items as MovieListItem[];
  return [];
}

/** Tag every item in a list with which source it came from. */
function tagSource<T>(items: T[], source: MovieSource): (T & { _source: MovieSource })[] {
  return items.map((m) => ({ ...m, _source: source }));
}

/* ------------------------------------------------------------------ */
/* ophim1.com normalisation                                            */
/* ------------------------------------------------------------------ */

/**
 * ophim1.com's images live on img.ophim1.com, not phimimg.com (the CDN
 * `IMAGE_BASE_URL` points at). Every render path in this app already
 * treats a poster/thumb path starting with http(s):// as a finished
 * URL and uses it as-is — so resolving ophim's paths to absolute URLs
 * right here, once, is enough to fix them everywhere without touching
 * every component that renders a poster.
 */
function resolveOphimImage(path: unknown): string {
  if (typeof path !== 'string' || path.length === 0) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${OPHIM_IMAGE_BASE_URL}/${path.replace(/^\//, '')}`;
}

/**
 * ophim1.com's flat `/danh-sach/phim-moi-cap-nhat` list endpoint is
 * leaner than phimapi's clone of it — it doesn't return `quality`,
 * `lang`, `episode_current`/`episode_total`, `type`, or `chieurap`.
 * That's exactly why those badges/labels were blank ("thông tin không
 * hiển thị") for ophim-sourced titles. Fill sane defaults here so the
 * cards render the same as any other source; the movie DETAIL page
 * still gets the real values straight from ophim's `/phim/[slug]`.
 */
function normalizeOphimListItem(raw: MovieListItem): MovieListItem {
  const isSeries = (raw as unknown as { tmdb?: { type?: string } })?.tmdb?.type === 'tv';
  return {
    ...raw,
    poster_url: resolveOphimImage(raw.poster_url),
    thumb_url: resolveOphimImage(raw.thumb_url),
    episode_current: raw.episode_current ?? (isSeries ? 'Đang cập nhật' : 'Full'),
    episode_total: raw.episode_total ?? '',
    quality: raw.quality ?? 'HD',
    lang: raw.lang ?? 'Vietsub',
    type: raw.type ?? (isSeries ? 'series' : 'single'),
    chieurap: raw.chieurap ?? false,
  };
}

/** Same image-domain fix, applied to a movie-detail payload. */
function normalizeOphimDetail(raw: MovieDetailResponse): MovieDetailResponse {
  if (!raw?.movie) return raw;
  return {
    ...raw,
    movie: {
      ...raw.movie,
      poster_url: resolveOphimImage(raw.movie.poster_url),
      thumb_url: resolveOphimImage(raw.movie.thumb_url),
    },
  };
}

/* ------------------------------------------------------------------ */
/* vsmov.com normalisation                                             */
/* ------------------------------------------------------------------ */

/**
 * vsmov's images are usually absolute `https://vsmov.com/storage/...`
 * URLs, but some records return `poster_url: {}` (an empty object). Guard
 * against non-string values so the card renderers get a clean string.
 */
function resolveVsmovImage(path: unknown): string {
  if (typeof path !== 'string' || path.length === 0) return '';
  return path;
}

/**
 * vsmov's flat list endpoints (e.g. `/danh-sach/4k`) are lean like
 * ophim's — no `quality`, `lang`, `episode_current`, `type`, `chieurap`.
 * Fill sane defaults so the cards render full badges. For the 4K feed we
 * hard-set `quality: '4K'` so the premium card can show its 4K badge even
 * before the movie detail loads.
 */
function normalizeVsmov4KItem(raw: MovieListItem): MovieListItem {
  const isSeries = (raw as unknown as { tmdb?: { type?: string } })?.tmdb?.type === 'tv';
  return {
    ...raw,
    poster_url: resolveVsmovImage(raw.poster_url),
    thumb_url: resolveVsmovImage(raw.thumb_url),
    episode_current: raw.episode_current ?? (isSeries ? 'Đang cập nhật' : 'Full'),
    episode_total: raw.episode_total ?? '',
    quality: '4K',
    lang: raw.lang ?? 'Vietsub',
    type: raw.type ?? (isSeries ? 'series' : 'single'),
    chieurap: raw.chieurap ?? false,
  };
}

/**
 * vsmov's premium 4K catalog — flat `/danh-sach/4k` endpoint
 * (`{ status, items, pagination }`). vsmov only has the legacy flat shape
 * (no `/v1/api/...`). Items are tagged `_source: 'vsmov'` so the detail
 * page loads the correct source, and normalised with `quality: '4K'`.
 */
export async function getVsmov4KMovies(
  page = 1,
): Promise<APIListResponse<MovieListItem>> {
  const res = await safeRetry(() =>
    vsmovGet<APIListResponse<MovieListItem>>('/danh-sach/4k', {
      params: { page },
    }),
  );
  const items = tagSource(
    extractItems(res).map(normalizeVsmov4KItem),
    'vsmov',
  );
  return {
    status: true,
    items,
    pagination: res?.pagination,
  };
}

/* ------------------------------------------------------------------ */
/* Latest movies — merge phimapi + vsmov + ophim, dedupe               */
/* ------------------------------------------------------------------ */

export async function getLatestMoviesDual(
  page = 1,
): Promise<APIListResponse<MovieListItem>> {
  const [primary, secondary, tertiary] = await Promise.all([
    safe(
      apiGet<APIListResponse<MovieListItem>>('/danh-sach/phim-moi-cap-nhat', {
        params: { page },
      }),
    ),
    // vsmov's freshness is on the first page only; skip for deeper pages.
    page === 1
      ? safeRetry(() =>
          vsmovGet<APIListResponse<MovieListItem>>(
            '/danh-sach/phim-moi-cap-nhat',
            { params: { page: 1 } },
          ),
        )
      : Promise.resolve(null),
    // ophim1 has its own freshness ordering, so keep paginating it too.
    safeRetry(() =>
      ophimGet<APIListResponse<MovieListItem>>(
        '/danh-sach/phim-moi-cap-nhat',
        { params: { page } },
      ),
    ),
  ]);

  const primaryItems = tagSource(extractItems(primary), 'phimapi');
  const secondaryItems = tagSource(extractItems(secondary), 'vsmov');
  const tertiaryItems = tagSource(
    extractItems(tertiary).map(normalizeOphimListItem),
    'ophim',
  );

  // Order = priority when slugs collide (near-certain for most titles,
  // since all three sources mirror the same underlying Vietnamese movie
  // database — see dedupeBySlug below): phimapi's data is the richest,
  // so it wins ties; vsmov next; ophim fills in whatever's exclusive to
  // it or missing from the other two.
  const merged = dedupeBySlug([...primaryItems, ...secondaryItems, ...tertiaryItems]);

  return {
    status: true,
    items: merged,
    pagination: primary?.pagination ?? tertiary?.pagination,
  };
}

/* ------------------------------------------------------------------ */
/* Catalog stats — for the "Tổng số phim" sidebar card                 */
/* ------------------------------------------------------------------ */

export interface CatalogStats {
  phimapi: number;
  vsmov: number;
  ophim: number;
  /**
   * Sum of phimapi + vsmov's reported totals only. This is an UPPER-BOUND
   * estimate, not the true deduped count — the sources mirror some of
   * the same underlying catalog, and figuring out the real unique total
   * would mean crawling & deduping every page of both APIs client-side,
   * which isn't practical. ophim1 is intentionally excluded from this
   * figure. Framed as "phim trong kho (ước tính)" in the UI rather than
   * an exact figure.
   */
  totalEstimated: number;
}

/**
 * Cheap: one page=1 request per source, we only read `pagination.totalItems`.
 */
export async function getCatalogStats(): Promise<CatalogStats> {
  const [primary, secondary, tertiary] = await Promise.all([
    safe(
      apiGet<APIListResponse<MovieListItem>>('/danh-sach/phim-moi-cap-nhat', {
        params: { page: 1 },
      }),
    ),
    safe(
      vsmovGet<APIListResponse<MovieListItem>>('/danh-sach/phim-moi-cap-nhat', {
        params: { page: 1 },
      }),
    ),
    safe(
      ophimGet<APIListResponse<MovieListItem>>('/danh-sach/phim-moi-cap-nhat', {
        params: { page: 1 },
      }),
    ),
  ]);

  const phimapi = primary?.pagination?.totalItems ?? 0;
  const vsmov = secondary?.pagination?.totalItems ?? 0;
  const ophim = tertiary?.pagination?.totalItems ?? 0;

  // "Đầu phim duy nhất" only counts phimapi + vsmov (ophim excluded per request).
  return { phimapi, vsmov, ophim, totalEstimated: phimapi + vsmov };
}

/* ------------------------------------------------------------------ */
/* Search — merge results from both APIs                               */
/* ------------------------------------------------------------------ */

export async function searchMoviesDual(
  keyword: string,
  limit: number = 24,
): Promise<APIListResponse<MovieListItem>> {
  const trimmed = keyword.trim();
  if (!trimmed) return { status: true, items: [] };

  // Fetch pages 1+2 from phimapi (up to 128 items) + page 1 from vsmov.
  // Short keywords like "mai" match hundreds of titles — page 1 alone
  // (64 items) can bury an exact-name match behind partial hits like
  // "Mãi Mãi", "Mái Nhà", etc. Two pages cost one extra request but
  // virtually guarantee the exact title surfaces for ranking.
  const fetchLimit = 64;

  const [primary, primaryP2, secondary] = await Promise.all([
    safe(
      apiGet<APIListResponse<MovieListItem>>('/v1/api/tim-kiem', {
        params: { keyword: trimmed, limit: fetchLimit },
      }),
    ),
    safe(
      apiGet<APIListResponse<MovieListItem>>('/v1/api/tim-kiem', {
        params: { keyword: trimmed, limit: fetchLimit, page: 2 },
      }),
    ),
    safeRetry(() =>
      vsmovGet<APIListResponse<MovieListItem>>('/tim-kiem', {
        params: { keyword: trimmed, limit: fetchLimit },
      }),
    ),
  ]);

  const primaryItems = [
    ...extractItems(primary),
    ...extractItems(primaryP2),
  ];
  const secondaryItems = extractItems(secondary);

  // Rank by relevance instead of naively concatenating — ensures exact
  // matches from either source surface first and vsmov results aren't
  // buried behind loosely-matching phimapi results.
  // Return ALL matched results — UI handles pagination/load-more
  const ranked = rankAndMerge(primaryItems, secondaryItems, trimmed, Math.max(limit, 128));

  return { status: true, items: ranked };
}

/* ------------------------------------------------------------------ */
/* Movie detail — phimapi first, vsmov fallback, merge episode servers */
/* ------------------------------------------------------------------ */

/** Normalise an episode's server_name so obvious duplicates dedupe. */
function normalizeServer(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/#\d+/g, '')
    .trim();
}

function mergeEpisodes(
  primary: Episode[] = [],
  secondary: Episode[] = [],
): Episode[] {
  const seen = new Set<string>();
  const out: Episode[] = [];
  for (const ep of [...primary, ...secondary]) {
    if (!ep?.server_name) continue;
    const key = normalizeServer(ep.server_name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ep);
  }
  return out;
}

/**
 * Fetch movie detail from a SINGLE named source (no merge, no fallback).
 * Used to enrich the homepage hero banner — the hero slides come from the
 * latest-feed where each item is already tagged with `_source`, so we only
 * need the one source's detail (content, quality, episode, lang) to render
 * the tophim-style banner without tripling the request count.
 */
export async function getMovieDetailFromSource(
  slug: string,
  source: MovieSource = 'phimapi',
): Promise<MovieDetailResponse | null> {
  const client =
    source === 'vsmov' ? vsmovGet : source === 'ophim' ? ophimGet : apiGet;
  const raw = await safe(client<MovieDetailResponse>(`/phim/${slug}`));
  if (!raw?.movie) return null;
  return source === 'ophim' ? normalizeOphimDetail(raw) : raw;
}

/**
 * Fetch movie detail from all three sources and merge episode servers.
 *
 * @param slug    Movie slug (URL identifier).
 * @param prefer  Optional source hint — when a search/list result
 *                carries `_source`, pass it here so the detail page
 *                loads the *same* movie the user clicked (avoids slug
 *                collisions where sources map the same slug to
 *                different films).
 */
export async function getMovieDetailDual(
  slug: string,
  prefer?: MovieSource,
): Promise<MovieDetailResponse> {
  const [primary, secondary, tertiaryRaw] = await Promise.all([
    safe(apiGet<MovieDetailResponse>(`/phim/${slug}`)),
    safe(vsmovGet<MovieDetailResponse>(`/phim/${slug}`)),
    safe(ophimGet<MovieDetailResponse>(`/phim/${slug}`)),
  ]);
  const tertiary = tertiaryRaw?.movie ? normalizeOphimDetail(tertiaryRaw) : tertiaryRaw;

  const hasPrimary = !!primary?.movie;
  const hasSecondary = !!secondary?.movie;
  const hasTertiary = !!tertiary?.movie;

  const bySource: Partial<Record<MovieSource, MovieDetailResponse>> = {
    phimapi: hasPrimary ? primary! : undefined,
    vsmov: hasSecondary ? secondary! : undefined,
    ophim: hasTertiary ? tertiary! : undefined,
  };

  /** Only merge episodes from `other` into `base` if they're confirmed
   *  to be the same movie (matching TMDB id) — different slugs can map
   *  to entirely different films across sources, so blindly merging
   *  episodes would play the wrong video. */
  function withMergedEpisodes(
    base: MovieDetailResponse,
    ...others: (MovieDetailResponse | undefined)[]
  ): MovieDetailResponse {
    let episodes = base.episodes ?? [];
    for (const other of others) {
      if (!other?.movie) continue;
      const sameTmdbId =
        base.movie.tmdb?.id &&
        other.movie.tmdb?.id &&
        String(base.movie.tmdb.id) === String(other.movie.tmdb.id);
      if (sameTmdbId) episodes = mergeEpisodes(episodes, other.episodes);
    }
    return { ...base, episodes };
  }

  // Caller explicitly prefers a source (from a search/list click) —
  // use that source as the base, merge episodes from any others that
  // are confirmed to be the same movie.
  if (prefer && bySource[prefer]) {
    const base = bySource[prefer]!;
    const others = (Object.keys(bySource) as MovieSource[])
      .filter((s) => s !== prefer)
      .map((s) => bySource[s]);
    return withMergedEpisodes(base, ...others);
  }

  // Default priority: phimapi > vsmov > ophim.
  if (hasPrimary) return withMergedEpisodes(primary!, secondary ?? undefined, tertiary ?? undefined);
  if (hasSecondary) return withMergedEpisodes(secondary!, tertiary ?? undefined);
  if (hasTertiary) return tertiary!;

  // All three failed — propagate an error so the UI can show it.
  throw new Error('Movie not found on any source');
}