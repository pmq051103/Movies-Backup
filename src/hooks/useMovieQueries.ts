import { useQuery } from '@tanstack/react-query';
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
import { IMAGE_BASE_URL, QUERY_KEYS } from '@/constants';

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
 * The vsmov `/danh-sach/[slug]` endpoint IGNORES `category` / `country`
 * filters even though it accepts the params. To honour filters we must
 * dispatch to different upstream endpoints:
 *   - genre set     -> /the-loai/[genre]   (respects country + type)
 *   - country set   -> /quoc-gia/[country] (respects type)
 *   - otherwise     -> /danh-sach/[phim-le|phim-bo]
 * `kind` = 'phim-le' or 'phim-bo' decides the intrinsic movie type when
 * the caller narrows a genre/country listing.
 */
/**
 * The vsmov `/danh-sach/[slug]` endpoint SILENTLY IGNORES the `category`,
 * `country`, and `year` query params — passing them returns unfiltered
 * data. To actually honour filters we must dispatch to the matching
 * dedicated endpoints, which DO respect the params documented below:
 *
 *   endpoint                 respects (in addition to the URL slug)
 *   -----------------------  -------------------------------------
 *   /the-loai/[genre]        country, type, year, status, sort_*
 *   /quoc-gia/[country]      type, year, status, sort_*
 *   /nam/[year]              type, status, sort_*
 *   /danh-sach/[phim-le|bo]  status, sort_* only
 *
 * Priority (most-specific first): genre > country > year > slug.
 */
function pickFilteredEndpoint(
  kind: "phim-le" | "phim-bo",
  params?: FilterParams,
): { url: string; params: Record<string, unknown> } {
  const p = { ...(params ?? {}) };
  const genre = p.category as string | undefined;
  const country = p.country as string | undefined;
  const year = p.year as string | number | undefined;
  const typeForKind = kind === "phim-le" ? "single" : "series";

  delete (p as Record<string, unknown>).category;
  delete (p as Record<string, unknown>).country;
  // year is embedded in the path for /nam/[year]; keep it as a query for
  // /the-loai and /quoc-gia which respect ?year=.

  if (genre) {
    return {
      url: `/v1/api/the-loai/${genre}`,
      params: { ...p, country, type: p.type ?? typeForKind },
    };
  }

  if (country) {
    return {
      url: `/v1/api/quoc-gia/${country}`,
      params: { ...p, type: p.type ?? typeForKind },
    };
  }

  if (year) {
    delete (p as Record<string, unknown>).year;
    return {
      url: `/v1/api/nam/${year}`,
      params: { ...p, type: p.type ?? typeForKind },
    };
  }

  return {
    url: `/v1/api/danh-sach/${kind}`,
    params: { ...p, type: p.type ?? typeForKind },
  };
}

async function fetchFilteredMovies(
  kind: "phim-le" | "phim-bo",
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
