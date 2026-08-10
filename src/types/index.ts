/**
 * Global TypeScript types for the Movie Streaming application.
 * Mirrors the vsmov.com public API response shapes.
 */

/* ------------------------------------------------------------------ */
/* Primitive / shared value types                                     */
/* ------------------------------------------------------------------ */

/** Type of a title as reported by the API. */
export type MovieType = "single" | "series" | "hoathinh" | "tvshows";

/** Playback / production status of a title. */
export type MovieStatus = "trailer" | "ongoing" | "completed";

/** Category slugs commonly used for the `/danh-sach/[slug]` endpoint. */
export type MovieListSlug =
  | "phim-moi-cap-nhat"
  | "phim-le"
  | "phim-bo"
  | "hoathinh"
  | "tv-shows"
  | "phim-sap-chieu"
  | "subteam"
  | "phim-4k"
  | string;

export type Theme = "dark" | "light";
export type Language = "vi" | "en";

/* ------------------------------------------------------------------ */
/* Nested value objects                                                */
/* ------------------------------------------------------------------ */

export interface TMDBInfo {
  type: string;
  id: string;
  season: number | null;
  vote_average: string;
  vote_count: number;
}

export interface IMDBInfo {
  id: string;
}

export interface TimeInfo {
  time: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface CountryItem {
  id: number;
  name: string;
  slug: string;
}

/* ------------------------------------------------------------------ */
/* Movie list item (as returned in list-style endpoints)              */
/* ------------------------------------------------------------------ */

export interface MovieListItem {
  tmdb: TMDBInfo;
  imdb: IMDBInfo;
  modified: TimeInfo;
  _id: number;
  name: string;
  origin_name: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  type: string;
  chieurap: boolean;
}

/** Alias kept for readability in components that just render a "movie card". */
export type Movie = MovieListItem;

/* ------------------------------------------------------------------ */
/* Movie detail                                                       */
/* ------------------------------------------------------------------ */

export interface MovieDetailData {
  tmdb: TMDBInfo;
  imdb: IMDBInfo;
  created: TimeInfo;
  modified: TimeInfo;
  _id: number;
  name: string;
  origin_name: string;
  slug: string;
  content: string;
  type: MovieType;
  status: MovieStatus;
  poster_url: string;
  thumb_url: string;
  trailer_url: string | null;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string | null;
  showtimes: string;
  year: number;
  keywords: string[];
  view: number;
  chieurap: boolean;
  sub_docquyen: boolean;
  actor: string[];
  director: string[];
  category: CategoryItem[];
  country: CountryItem[];
}

/** Alias for readability. */
export type MovieDetail = MovieDetailData;

export interface ServerData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8?: string;
}

export interface Episode {
  server_name: string;
  server_data: ServerData[];
}

export interface MovieDetailResponse {
  status: boolean;
  msg: string;
  movie: MovieDetailData;
  episodes: Episode[];
}

/* ------------------------------------------------------------------ */
/* Genre / Country reference data                                     */
/* ------------------------------------------------------------------ */

export interface Genre {
  _id: number;
  name: string;
  slug: string;
}

export interface Country {
  _id: number;
  name: string;
  slug: string;
}

export interface GenreListResponse {
  status: boolean;
  items: Genre[];
}

export interface CountryListResponse {
  status: boolean;
  items: Country[];
}

/* ------------------------------------------------------------------ */
/* Actor                                                               */
/* ------------------------------------------------------------------ */

export interface ActorInfo {
  _id: number;
  name: string;
  slug: string;
  original_name?: string;
  biography?: string;
  profile_url?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  known_for?: MovieListItem[];
}

export interface ActorInfoResponse {
  status: boolean;
  msg?: string;
  actor: ActorInfo;
  movies?: MovieListItem[];
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export interface Pagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/* Generic API response wrappers                                      */
/* ------------------------------------------------------------------ */

export interface APIListResponse<T = MovieListItem> {
  status: boolean | string;
  items: T[];
  pagination?: Pagination;
  pathImage?: string;
}

/** Generic wrapper for any raw API response, used by the axios client. */
export interface APIResponse<T = unknown> {
  status: boolean | string;
  msg?: string;
  data?: T;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Request parameter shapes                                            */
/* ------------------------------------------------------------------ */

export interface FilterParams {
  page?: number;
  limit?: number;
  year?: number | string;
  country?: string;
  category?: string;
  type?: MovieType | string;
  status?: MovieStatus | string;
  sort_field?: string;
  sort_type?: "asc" | "desc";
  sort_lang?: string;
}

export interface SearchParams {
  keyword: string;
  limit?: number;
  page?: number;
}

export interface PageParams {
  page?: number;
}

/* ------------------------------------------------------------------ */
/* UI-level supporting types                                          */
/* ------------------------------------------------------------------ */

export interface HomeSection {
  title: string;
  slug: MovieListSlug;
  type?: MovieType;
  params?: FilterParams;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

/** Item stored in the local "continue watching" history. */
export interface WatchHistoryItem {
  slug: string;
  name: string;
  poster_url: string;
  thumb_url: string;
  episode: string;
  server: string;
  progress: number; // seconds watched
  duration: number; // total seconds
  updatedAt: number; // epoch ms
  type: MovieType;
}

export interface FilterState {
  genre?: string;
  country?: string;
  year?: number | string;
  quality?: string;
  language?: string;
  status?: MovieStatus | string;
  /** Optional movie-type override (single / series / hoathinh / tvshows). */
  type?: MovieType | string;
  sortField?: string;
  sortType?: "asc" | "desc";
  page?: number;
}

/* ------------------------------------------------------------------ */
/* Error types                                                        */
/* ------------------------------------------------------------------ */

export type APIErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "UNKNOWN";

export interface APIErrorShape {
  code: APIErrorCode;
  message: string;
  status?: number;
  originalError?: unknown;
}
