// ==========================================================================
// App-wide constants: API config, routes, query keys, storage keys, and
// static option lists used throughout the Movie Streaming application.
// ==========================================================================

/* ------------------------------------------------------------------ */
/* API configuration                                                  */
/* ------------------------------------------------------------------ */

/**
 * Base URL for the movie API.
 * Default is the relative path `/api` — dev server (Vite proxy) and prod
 * hosts (Vercel/Netlify rewrites config bundled with the project) both
 * forward it to https://vsmov.com/api, bypassing CORS.
 * Override with VITE_API_BASE_URL when you deploy to a host that cannot
 * proxy and you need to hit the upstream directly.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

/** CDN base URL used to resolve relative poster/thumb image paths. */
export const IMAGE_BASE_URL: string =
  (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) ??
  'https://phimimg.com';

/**
 * Image CDN for the tertiary source (ophim1.com). ophim images are
 * hosted on their own domain, NOT phimimg.com — using `IMAGE_BASE_URL`
 * for them 404s, which is why ophim-sourced posters/thumbs looked
 * "missing" before. Resolved once in `dualSource.ts` so every existing
 * render path (which already accepts a ready-made http(s):// URL as-is)
 * just works without changes.
 */
export const OPHIM_IMAGE_BASE_URL: string =
  (import.meta.env.VITE_OPHIM_IMAGE_BASE_URL as string | undefined) ??
  'https://img.ophim1.com/uploads/movies';

export const API_TIMEOUT = 15000;

/**
 * phimapi.com has two API layers:
 *   - Root (`/danh-sach/phim-moi-cap-nhat`, `/phim/[slug]`, `/the-loai`,
 *     `/quoc-gia`) returns a legacy flat shape.
 *   - `/v1/api/...` returns a nested `{ status, msg, data: { items,
 *     params: { pagination } } }` shape but crucially RESPECTS every
 *     filter param (category, country, year, type, status, sort).
 * We route each use case to the layer that returns the richest data.
 */
export const API_ENDPOINTS = {
  LATEST_MOVIES: '/danh-sach/phim-moi-cap-nhat',
  LIST_BY_SLUG: (slug: string) => `/v1/api/danh-sach/${slug}`,
  SEARCH: '/v1/api/tim-kiem',
  GENRES: '/the-loai',
  MOVIES_BY_GENRE: (slug: string) => `/v1/api/the-loai/${slug}`,
  COUNTRIES: '/quoc-gia',
  MOVIES_BY_COUNTRY: (slug: string) => `/v1/api/quoc-gia/${slug}`,
  MOVIES_BY_YEAR: (year: string | number) => `/v1/api/nam/${year}`,
  MOVIE_DETAIL: (slug: string) => `/phim/${slug}`,
  ACTOR_DETAIL: (slug: string) => `/dien-vien/${slug}`,
} as const;

/* ------------------------------------------------------------------ */
/* List slugs (used with /danh-sach/[slug])                           */
/* ------------------------------------------------------------------ */

export const LIST_SLUGS = {
  NEWEST: 'phim-moi-cap-nhat',
  SINGLE: 'phim-le',
  SERIES: 'phim-bo',
  HOATHINH: 'hoathinh',
  TV_SHOWS: 'tv-shows',
  NOW_PLAYING: 'phim-chieu-rap',
  UPCOMING: 'phim-sap-chieu',
  SUBTEAM: 'subteam',
  PHIM_4K: 'phim-4k',
} as const;

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

export const ROUTES = {
  HOME: '/',
  MOVIES: '/phim-le',
  SERIES: '/phim-bo',
  ANIME: '/hoathinh',
  TV_SHOWS: '/phim-bo',
  TV_SHOW_PROGRAMS: '/tv-shows',
  NOW_PLAYING: '/phim-chieu-rap',
  UPCOMING: '/phim-sap-chieu',
  PHIM_4K: '/phim-4k',
  SEARCH: '/tim-kiem',
  GENRES: '/the-loai',
  GENRE_DETAIL: (slug: string) => `/the-loai/${slug}`,
  COUNTRIES: '/quoc-gia',
  COUNTRY_DETAIL: (slug: string) => `/quoc-gia/${slug}`,
  MOVIE_DETAIL: '/phim',
  WATCH: '/xem',
  TOP_RATED: '/top-rated',
  ACTOR_DETAIL: (slug: string) => `/dien-vien/${slug}`,
  FAVORITES: '/yeu-thich',
  HISTORY: '/lich-su',
  DONATE: '/donate',
  NOT_FOUND: '/404',
} as const;

/* ------------------------------------------------------------------ */
/* React Query keys                                                   */
/* ------------------------------------------------------------------ */

export const QUERY_KEYS = {
  LATEST_MOVIES: 'latestMovies',
  MOVIES_BY_SLUG: 'moviesBySlug',
  MOVIE_DETAIL: 'movieDetail',
  SINGLE_MOVIES: 'singleMovies',
  SERIES_MOVIES: 'seriesMovies',
  TV_SHOWS: 'tvShows',
  MOVIES: 'movies',
  ANIME: 'anime',
  TV_SHOW_PROGRAMS: 'tvShowPrograms',
  SEARCH_MOVIES: 'searchMovies',
  GENRES: 'genres',
  MOVIES_BY_GENRE: 'moviesByGenre',
  COUNTRIES: 'countries',
  MOVIES_BY_COUNTRY: 'moviesByCountry',
  ACTOR_DETAIL: 'actorDetail',
  CATALOG_STATS: 'catalogStats',
} as const;

/* ------------------------------------------------------------------ */
/* Local storage keys                                                 */
/* ------------------------------------------------------------------ */

export const STORAGE_KEYS = {
  THEME: 'movie-app-theme',
  LANGUAGE: 'movie-app-language',
  FAVORITES: 'movie-app-favorites',
  HISTORY: 'movie-app-history',
  PLAYER_SETTINGS: 'movie-app-player',
  RECENT_SEARCHES: 'movie-app-searches',
} as const;

/* ------------------------------------------------------------------ */
/* Pagination / misc defaults                                         */
/* ------------------------------------------------------------------ */

export const DEFAULT_PAGE_SIZE = 24;
export const ITEMS_PER_PAGE = 24;
export const MAX_RECENT_SEARCHES = 10;
export const SEARCH_DEBOUNCE_MS = 500;
export const DEBOUNCE_DELAY = 500;

/* ------------------------------------------------------------------ */
/* Movie type / status option lists                                   */
/* ------------------------------------------------------------------ */

export const MOVIE_TYPES = {
  SINGLE: 'single',
  SERIES: 'series',
  HOATHINH: 'hoathinh',
  TVSHOWS: 'tvshows',
} as const;

export const MOVIE_TYPE_OPTIONS = [
  { label: 'Phim lẻ', value: MOVIE_TYPES.SINGLE },
  { label: 'Phim bộ', value: MOVIE_TYPES.SERIES },
  { label: 'Hoạt hình', value: MOVIE_TYPES.HOATHINH },
  { label: 'TV Shows', value: MOVIE_TYPES.TVSHOWS },
] as const;

export const MOVIE_STATUS = {
  TRAILER: 'trailer',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;

export const MOVIE_STATUS_OPTIONS = [
  { label: 'Trailer', value: MOVIE_STATUS.TRAILER },
  { label: 'Đang chiếu', value: MOVIE_STATUS.ONGOING },
  { label: 'Hoàn thành', value: MOVIE_STATUS.COMPLETED },
] as const;

export const STATUS_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Trailer', value: 'trailer' },
  { label: 'Đang chiếu', value: 'ongoing' },
  { label: 'Hoàn thành', value: 'completed' },
] as const;

export const SORT_OPTIONS = [
  { label: 'Mới cập nhật', value: 'modified.time' },
  { label: 'Năm sản xuất', value: 'year' },
  { label: 'Lượt xem', value: 'view_total' },
  { label: 'Điểm đánh giá', value: 'tmdb.vote_average' },
] as const;

export const QUALITY_OPTIONS = ['HD', 'FHD', 'SD', '4K', 'CAM'] as const;

export const LANGUAGE_OPTIONS = ['Vietsub', 'Thuyết Minh', 'Lồng Tiếng'] as const;

/* ------------------------------------------------------------------ */
/* Years (used by year filters)                                       */
/* ------------------------------------------------------------------ */

const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => CURRENT_YEAR - i);

/* ------------------------------------------------------------------ */
/* Responsive breakpoints (px)                                        */
/* ------------------------------------------------------------------ */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/* ------------------------------------------------------------------ */
/* Slider / carousel configuration                                    */
/* ------------------------------------------------------------------ */

export const SLIDER_CONFIG = {
  HERO: {
    autoplayDelayMs: 6000,
    loop: true,
    slidesPerView: 1,
  },
  DEFAULT: {
    autoplayDelayMs: 4000,
    loop: false,
    spaceBetween: 12,
    breakpoints: {
      0: { slidesPerView: 2.3 },
      [BREAKPOINTS.sm]: { slidesPerView: 3.3 },
      [BREAKPOINTS.md]: { slidesPerView: 4.3 },
      [BREAKPOINTS.lg]: { slidesPerView: 5.3 },
      [BREAKPOINTS.xl]: { slidesPerView: 6.3 },
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */

export interface HomeSectionConfig {
  title: string;
  slug: string;
  type?: string;
  params?: Record<string, unknown>;
}

export const HOME_SECTIONS: HomeSectionConfig[] = [
  { title: 'Mới cập nhật', slug: LIST_SLUGS.NEWEST },
  { title: 'Phim lẻ mới', slug: LIST_SLUGS.SINGLE, type: 'single' },
  { title: 'Phim bộ mới', slug: LIST_SLUGS.SERIES, type: 'series' },
  { title: 'Hoạt hình', slug: LIST_SLUGS.HOATHINH, type: 'hoathinh' },
  { title: 'TV Shows', slug: LIST_SLUGS.TV_SHOWS, type: 'tvshows' },
  { title: 'Phim sắp chiếu', slug: LIST_SLUGS.UPCOMING, params: { status: 'trailer' } },
  { title: 'Subteam đề cử', slug: LIST_SLUGS.SUBTEAM },
  { title: 'Phim 4K', slug: LIST_SLUGS.PHIM_4K },
];
