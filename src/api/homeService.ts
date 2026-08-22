import { apiGet } from "@/api/axiosClient";
import { getLatestMoviesDual, getCatalogStats } from "@/api/dualSource";
import { LIST_SLUGS } from "@/constants";
import type {
  APIListResponse,
  FilterParams,
  MovieListItem,
  PageParams,
} from "@/types";
import type { CatalogStats } from "@/api/dualSource";

/**
 * Fetch the latest updated movies for the homepage feed.
 * Multi-sourced: phimapi (primary catalog) + vsmov (fresh titles) +
 * ophim1 (extra catalog), deduped by slug. See `dualSource.ts`.
 */
export async function getLatestMovies(
  page = 1,
): Promise<APIListResponse<MovieListItem>> {
  return getLatestMoviesDual(page);
}

/** Total-movie-count stats across all 3 sources, for the Home sidebar. */
export async function getMovieCatalogStats(): Promise<CatalogStats> {
  return getCatalogStats();
}

/**
 * Fetch movies for any `/danh-sach/[slug]` category.
 *
 * phimapi.com exposes two paths and they don't overlap:
 *   - `phim-moi-cap-nhat` ONLY exists at the legacy root path
 *     `/danh-sach/phim-moi-cap-nhat` (returns a flat `{items,pagination}`)
 *   - `phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`, `phim-vietsub`,
 *     `phim-thuyet-minh`, `phim-long-tieng` live under `/v1/api/danh-sach/`
 *     (returns nested `{data:{items,params:{pagination}}}`).
 * Route accordingly. Downstream code normalises both shapes via
 * `selectListResponse` in `useMovieQueries`.
 */
export async function getMoviesBySlug(
  slug: string = LIST_SLUGS.NEWEST,
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  const url =
    slug === LIST_SLUGS.NEWEST
      ? `/danh-sach/${slug}`
      : `/v1/api/danh-sach/${slug}`;
  return apiGet<APIListResponse<MovieListItem>>(url, { params });
}

/**
 * Fetch a `/v1/api/danh-sach/[slug]` listing that ALWAYS honours the
 * `category`, `country`, `year`, `type` and `sort_*` query params.
 *
 * Unlike `getMoviesBySlug`, this never falls back to the legacy
 * `/danh-sach/phim-moi-cap-nhat` root path (which silently ignores every
 * filter/sort param) — so `phim-moi-cap-nhat` can be used here as a
 * catch-all "tất cả phim" list that still respects the filters, which is
 * what the filterable topic pages (Top IMDb, Cổ Trang Trung Quốc, …) need.
 */
export async function getFilteredList(
  slug: string = LIST_SLUGS.NEWEST,
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(`/v1/api/danh-sach/${slug}`, {
    params,
  });
}

export const homeService = {
  getLatestMovies,
  getMoviesBySlug,
  getMovieCatalogStats,
};

export default homeService;

export type { PageParams };
