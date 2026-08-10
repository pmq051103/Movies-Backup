import { apiGet } from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/constants";
import type { APIListResponse, Genre, GenreListResponse, MovieListItem } from "@/types";

/**
 * Raw shape returned by the `/the-loai` endpoint. The genre list is nested
 * under `data.items`; some deployments return a flat `items` array instead,
 * so we defensively support both.
 */
interface RawGenreListResponse {
  status?: boolean | string;
  message?: string;
  data?: { items?: Genre[] };
  items?: Genre[];
}

/**
 * Slugs / name patterns for adult content that must never surface in the
 * genre dropdowns or listing filters. Filtered out at the service layer
 * so every consumer (Header dropdown, FilterSidebar, Home rows...) is
 * safe by construction.
 */
const ADULT_SLUGS = new Set(['phim-18', '18+', 'adult', 'erotic']);
const ADULT_NAME_PATTERNS = [/\b18\+/i, /adult/i, /erotic/i, /nude/i];

function isAdultGenre(g: Genre): boolean {
  if (ADULT_SLUGS.has(g.slug)) return true;
  return ADULT_NAME_PATTERNS.some((rx) => rx.test(g.name));
}

/**
 * Fetch the full list of genres, minus adult categories.
 */
export async function getAllGenres(): Promise<GenreListResponse> {
  const res = await apiGet<Genre[] | RawGenreListResponse>(API_ENDPOINTS.GENRES);
  const rawItems: Genre[] = Array.isArray(res)
    ? res
    : (res.data?.items ?? res.items ?? []);
  return { status: true, items: rawItems.filter((g) => !isAdultGenre(g)) };
}

/**
 * Fetch movies belonging to a given genre.
 * GET /the-loai/[slug]?page=
 */
export async function getMoviesByGenre(
  slug: string,
  page = 1,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(
    API_ENDPOINTS.MOVIES_BY_GENRE(slug),
    { params: { page } },
  );
}

export const genreService = {
  getAllGenres,
  getMoviesByGenre,
};

export default genreService;
