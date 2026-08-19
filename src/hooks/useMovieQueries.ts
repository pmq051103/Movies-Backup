import { useQuery, useQueries } from '@tanstack/react-query';
import {
  getLatestMovies,
  getMovieDetail,
  searchMovies,
  getGenres,
  getMoviesByGenre,
  getCountries,
  getMoviesByCountry,
  getMoviesBySlug,
  getMovieCatalogStats,
} from '@/api';
import { getMovieDetailFromSource } from '@/api/dualSource';
import { getTmdbExtras } from '@/api/tmdbService';
import type {
  MovieListItem,
  MovieDetailResponse,
  Pagination,
  APIListResponse,
  FilterParams,
  SearchParams,
  PageParams,
  Genre,
  Country,
} from '@/types';
import type { MovieSource, CatalogStats } from '@/api/dualSource';
import { IMAGE_BASE_URL, QUERY_KEYS, TMDB_API_KEY } from '@/constants';

/* ------------------------------------------------------------------ */
/* Image URL helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Defensively normalise an image URL from the API.
 *
 * The upstream is inconsistent — some records return `thumb_url: {}` (an
 * empty object literal) or `null`. If we call `.startsWith` on those values
 * a TypeError is thrown and the whole `.map()` (and therefore the entire
 * query result) fails, which is why country/genre pages sometimes render
 * as empty grids even though the API clearly returned items.
 */
function transformImageUrl(url: unknown): string {
  if (typeof url !== 'string' || url.length === 0) return '';
  if (url.startsWith('http')) return url;
  return `${IMAGE_BASE_URL}/${url.replace(/^\//, '')}`;
}

function transformMovieItems(items: MovieListItem[]): MovieListItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    poster_url: transformImageUrl(item.poster_url),
    thumb_url: transformImageUrl(item.thumb_url),
  }));
}

/* ------------------------------------------------------------------ */
/* Transformed result shape                                            */
/* ------------------------------------------------------------------ */

interface TransformedListResult {
  items: MovieListItem[];
  pagination: Pagination;
}

/**
 * Selects and transforms an APIListResponse into a normalized shape
 * with image URLs resolved and a guaranteed pagination object.
 */
interface RawV1ListResponse {
  status?: boolean | string;
  msg?: string;
  data?: {
    items?: MovieListItem[];
    params?: { pagination?: Pagination };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
  // Also accept the legacy flat shape.
  items?: MovieListItem[];
  pagination?: Pagination;
}

function selectListResponse(
  raw: APIListResponse<MovieListItem> | RawV1ListResponse,
): TransformedListResult {
  // Unwrap the v1/api nested shape if present. Fall back to the legacy
  // flat shape used by /danh-sach/phim-moi-cap-nhat.
  const dataObj = (raw as RawV1ListResponse).data;
  const items: MovieListItem[] =
    dataObj?.items ?? (raw as APIListResponse<MovieListItem>).items ?? [];
  const pagination: Pagination =
    dataObj?.params?.pagination ??
    (raw as APIListResponse<MovieListItem>).pagination ?? {
      totalItems: items.length,
      totalItemsPerPage: items.length,
      currentPage: 1,
      totalPages: 1,
    };

  return {
    items: transformMovieItems(items),
    pagination,
  };
}

/* ------------------------------------------------------------------ */
/* Query hooks                                                         */
/* ------------------------------------------------------------------ */

/** Latest updated movies feed (homepage). */
export function useLatestMovies(page: number = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.LATEST_MOVIES, page],
    queryFn: () => getLatestMovies(page),
    select: selectListResponse,
  });
}

/**
 * Enrich the top hero slides with detail data so the banner can render
 * the full tophim-style meta (description, quality, episode, lang, time).
 * One lightweight single-source request per slide (source from `_source`).
 */
export interface HeroSlide extends MovieListItem {
  _source?: MovieSource;
  content?: string;
  time?: string;
  lang_key?: string;
  category?: { id: number; name: string; slug: string }[];
  country?: { id: number; name: string; slug: string }[];
}

export function useHeroMovies(movies: MovieListItem[], limit = 5) {
  const slides = movies.slice(0, limit);
  const queries = useQueries({
    queries: slides.map((m) => {
      const src = (m as HeroSlide)._source ?? 'phimapi';
      return {
        queryKey: [QUERY_KEYS.MOVIE_DETAIL, 'hero', m.slug, src],
        queryFn: () => getMovieDetailFromSource(m.slug, src),
        enabled: !!m.slug,
        staleTime: 10 * 60 * 1000,
      };
    }),
  });

  return slides.map((m, i) => {
    const detail = queries[i]?.data?.movie;
    if (!detail) return m as HeroSlide;
    return {
      ...m,
      content: detail.content,
      time: detail.time,
      lang_key: detail.lang,
      episode_current: detail.episode_current || m.episode_current,
      quality: detail.quality || m.quality,
      lang: detail.lang || m.lang,
      category: detail.category,
      country: detail.country,
      tmdb: detail.tmdb,
    } as HeroSlide;
  });
}

/** Generic `/danh-sach/[slug]` listing (newest, phim-le, phim-bo, hoathinh, ...). */
export function useMoviesBySlug(slug?: string, params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES_BY_SLUG, slug, params],
    queryFn: () => getMoviesBySlug(slug!, params),
    enabled: !!slug,
    select: selectListResponse,
  });
}

/** Full movie/TV show detail by slug. */
export function useMovieDetail(slug?: string, prefer?: MovieSource) {
  return useQuery<MovieDetailResponse>({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, slug, prefer],
    queryFn: () => getMovieDetail(slug!, prefer),
    enabled: !!slug,
  });
}

/**
 * Cast (with real headshot photos) + real per-title gallery images
 * (backdrops/posters) + trailer/clip videos — all sourced from TMDB via
 * the tmdb id the phim API already attaches to every title
 * (`movie.tmdb.id`). The phim APIs themselves only return actor names as
 * plain strings and no real per-movie gallery/video data, so this backs
 * the actual headshots on "Diễn viên" and the real images/videos on
 * "Gallery". Resolves to empty arrays (never errors) when there's no API
 * key configured or no tmdb id on the movie; the UI falls back to
 * name-only placeholders / the backdrop+poster pair then.
 */
export function useTmdbExtras(tmdbId?: string | number | null, tmdbType?: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.TMDB_CAST, tmdbId, tmdbType],
    queryFn: () => getTmdbExtras(tmdbId, tmdbType),
    enabled: !!tmdbId && !!TMDB_API_KEY,
    staleTime: 24 * 60 * 60 * 1000, // 24h — cast/gallery data rarely changes
  });
}

/**
 * Aggregate "how many movies are in the catalog" stats (Home sidebar).
 * Cheap (1 lightweight request per source) but still worth caching for
 * a while — the number doesn't need to be second-by-second fresh.
 */
export function useCatalogStats() {
  return useQuery<CatalogStats>({
    queryKey: [QUERY_KEYS.CATALOG_STATS],
    queryFn: getMovieCatalogStats,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/** Keyword search. */
export function useSearchMovies(params: SearchParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_MOVIES, params],
    queryFn: () => searchMovies(params.keyword, params.limit),
    enabled: !!params.keyword && params.keyword.trim().length > 0,
    select: selectListResponse,
  });
}

/* ------------------------------------------------------------------ */
/* Filtered search (used by the enhanced SearchPage)                   */
/* ------------------------------------------------------------------ */

export interface FilteredSearchParams {
  keyword: string;
  country?: string;
  category?: string;
  year?: string;
  sort_field?: string;
  sort_type?: 'asc' | 'desc';
}

/**
 * Search with server-side filters. When any filter is active the query goes
 * directly to `/v1/api/tim-kiem` with the filter params — bypassing the
 * dual-source merge (vsmov doesn't support filters). When NO filters are set,
 * falls back to the existing `searchMoviesDual` which merges + ranks across
 * both APIs and fetches 2 pages.
 *
 * This is how the app's Duyệt Tìm works, now brought to the web.
 */
export function useFilteredSearch(params: FilteredSearchParams) {
  const keyword = params.keyword?.trim() ?? '';
  const hasFilters = !!(params.country || params.category || params.year);

  return useQuery({
    queryKey: ['filteredSearch', params],
    queryFn: async () => {
      if (!keyword) return { items: [], pagination: undefined };

      if (hasFilters) {
        // Direct API call with filters — vsmov can't filter so skip it
        const queryParams: Record<string, unknown> = {
          keyword,
          limit: 64,
        };
        if (params.country) queryParams.country = params.country;
        if (params.category) queryParams.category = params.category;
        if (params.year) queryParams.year = params.year;
        if (params.sort_field) {
          queryParams.sort_field = params.sort_field;
          queryParams.sort_type = params.sort_type ?? 'desc';
        }

        // Fetch 2 pages to avoid the "Mai" problem
        const { apiGet } = await import('@/api');
        const [p1, p2] = await Promise.all([
          apiGet<APIListResponse<MovieListItem>>('/v1/api/tim-kiem', {
            params: queryParams,
          }),
          apiGet<APIListResponse<MovieListItem>>('/v1/api/tim-kiem', {
            params: { ...queryParams, page: 2 },
          }).catch(() => null),
        ]);

        const items1 = (p1 as any)?.data?.items ?? (p1 as any)?.items ?? [];
        const items2 = (p2 as any)?.data?.items ?? (p2 as any)?.items ?? [];
        const allItems = [...items1, ...items2];

        // Dedupe
        const seen = new Set<string>();
        const deduped = allItems.filter((m: MovieListItem) => {
          if (!m?.slug || seen.has(m.slug)) return false;
          seen.add(m.slug);
          return true;
        });

        return {
          items: transformMovieItems(deduped),
          pagination: (p1 as any)?.data?.params?.pagination ?? (p1 as any)?.pagination,
        };
      }

      // No filters → use dual-source ranked search (existing logic)
      const result = await searchMovies(keyword, 128);
      return selectListResponse(result);
    },
    enabled: keyword.length > 0,
  });
}

/** Full genre list. */
export function useGenres() {
  return useQuery({
    queryKey: [QUERY_KEYS.GENRES],
    queryFn: getGenres,
    staleTime: Infinity,
    select: (data: { status: boolean; items: Genre[] }): Genre[] => data.items,
  });
}

/** Movies within a given genre (legacy, no type filter). */
export function useMoviesByGenre(slug?: string, params?: PageParams) {
  const page = params?.page ?? 1;
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES_BY_GENRE, slug, page],
    queryFn: () => getMoviesByGenre(slug!, page),
    enabled: !!slug,
    select: selectListResponse,
  });
}

/**
 * Direct query against `/v1/api/the-loai/[slug]` with pass-through params.
 * Unlike `useMovies({category})` this does NOT auto-inject a default
 * `type`, so callers can toggle between "all types" and "single/series".
 */
export function useMoviesInGenre(
  slug?: string,
  params?: FilterParams & { country?: string },
) {
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES_BY_GENRE, 'v1', slug, params],
    queryFn: async () => {
      const { apiGet } = await import('@/api/axiosClient');
      return apiGet<APIListResponse<MovieListItem>>(`/v1/api/the-loai/${slug}`, {
        params,
      });
    },
    enabled: !!slug,
    select: selectListResponse,
  });
}

/**
 * Same idea for `/v1/api/quoc-gia/[slug]` — pass-through, no auto type.
 */
export function useMoviesInCountry(slug?: string, params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES_BY_COUNTRY, 'v1', slug, params],
    queryFn: async () => {
      const { apiGet } = await import('@/api/axiosClient');
      return apiGet<APIListResponse<MovieListItem>>(`/v1/api/quoc-gia/${slug}`, {
        params,
      });
    },
    enabled: !!slug,
    select: selectListResponse,
  });
}

/** Full country list. */
export function useCountries() {
  return useQuery({
    queryKey: [QUERY_KEYS.COUNTRIES],
    queryFn: getCountries,
    staleTime: Infinity,
    select: (data: { status: boolean; items: Country[] }): Country[] => data.items,
  });
}

/** Movies from a given country. */
export function useMoviesByCountry(slug?: string, params?: PageParams) {
  const page = params?.page ?? 1;
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES_BY_COUNTRY, slug, page],
    queryFn: () => getMoviesByCountry(slug!, page),
    enabled: !!slug,
    select: selectListResponse,
  });
}

/**
 * phimapi's `/v1/api/danh-sach/[slug]` is the ONE endpoint that both keeps
 * the listing's intrinsic type AND honours the `category`, `country`,
 * `year`, `status` and `sort_*` query params. The dedicated
 * `/v1/api/the-loai/[genre]`, `/v1/api/quoc-gia/[country]` and
 * `/v1/api/nam/[year]` endpoints all SILENTLY IGNORE the `type` param —
 * dispatching there used to leak every other movie type into the phim-le /
 * phim-bo / hoạt hình / tv-shows listings the moment a filter was applied.
 * So every kind simply lists from `/danh-sach/[slug]` and passes the
 * filters through as query params; `kind` only picks the intrinsic type.
 */
type ListKind = "phim-le" | "phim-bo" | "hoathinh" | "tv-shows";

const TYPE_FOR_KIND: Record<ListKind, string> = {
  "phim-le": "single",
  "phim-bo": "series",
  hoathinh: "hoathinh",
  "tv-shows": "tvshows",
};

/**
 * The `/danh-sach/[slug]` endpoint's slug doesn't always match our internal
 * `kind` identifier — notably hoạt hình is served at `/danh-sach/hoat-hinh`
 * (with a dash), not `/danh-sach/hoathinh`. Kept separate from `kind` (used
 * for the `type` filter value) so each stays correct for its own purpose.
 */
const DANH_SACH_SLUG_FOR_KIND: Record<ListKind, string> = {
  "phim-le": "phim-le",
  "phim-bo": "phim-bo",
  hoathinh: "hoat-hinh",
  "tv-shows": "tv-shows",
};

function pickFilteredEndpoint(
  kind: ListKind,
  params?: FilterParams,
): { url: string; params: Record<string, unknown> } {
  const p = { ...(params ?? {}) };
  const typeForKind = TYPE_FOR_KIND[kind];

  return {
    url: `/v1/api/danh-sach/${DANH_SACH_SLUG_FOR_KIND[kind]}`,
    params: { ...p, type: p.type ?? typeForKind },
  };
}

async function fetchFilteredMovies(
  kind: ListKind,
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  const { url, params: qs } = pickFilteredEndpoint(kind, params);
  const { apiGet } = await import("@/api/axiosClient");
  return apiGet<APIListResponse<MovieListItem>>(url, { params: qs });
}

/** Movies (phim lẻ) with smart filter routing. */
export function useMovies(params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.MOVIES, params],
    queryFn: () => fetchFilteredMovies("phim-le", params),
    select: selectListResponse,
  });
}

/** TV shows (phim bộ) with smart filter routing. */
export function useTVShows(params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.TV_SHOWS, params],
    queryFn: () => fetchFilteredMovies("phim-bo", params),
    select: selectListResponse,
  });
}

/** Animation / hoạt hình with smart filter routing. */
export function useAnime(params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.ANIME, params],
    queryFn: () => fetchFilteredMovies("hoathinh", params),
    select: selectListResponse,
  });
}

/** TV shows (game shows / reality / talk shows) with smart filter routing. */
export function useTvShowPrograms(params?: FilterParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.TV_SHOW_PROGRAMS, params],
    queryFn: () => fetchFilteredMovies("tv-shows", params),
    select: selectListResponse,
  });
}
