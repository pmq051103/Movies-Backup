import { searchMoviesDual } from "@/api/dualSource";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { APIListResponse, MovieListItem } from "@/types";

/**
 * Dual-source search: merges results from phimapi + vsmov and dedupes
 * by slug, so newly-added Vietnamese titles from vsmov surface too.
 */
export async function searchMovies(
  keyword: string,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<APIListResponse<MovieListItem>> {
  return searchMoviesDual(keyword, limit);
}

export const searchService = { searchMovies };
export default searchService;
