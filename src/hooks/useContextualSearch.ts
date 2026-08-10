import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useSearchMovies } from './useMovies';
import type { MovieListItem } from '@/types';

/**
 * Search result item as returned by phimapi's `/v1/api/tim-kiem`. Unlike
 * the plain `MovieListItem`, it also carries `type`, `country`, and
 * `category` — used here to filter results down to the current page's
 * context (e.g. only Vietnamese movies on `/quoc-gia/viet-nam`).
 */
type SearchItem = MovieListItem & {
  type?: string;
  country?: Array<{ slug: string; name?: string; id?: string | number }>;
  category?: Array<{ slug: string; name?: string; id?: string | number }>;
};

export interface ContextFilter {
  /** Only keep movies with this country slug in their country list. */
  countrySlug?: string;
  /** Only keep movies with this category slug in their category list. */
  categorySlug?: string;
  /** Only keep movies whose type matches (single | series | hoathinh | tvshows). */
  type?: string;
}

/**
 * Hook for inline search inputs on filtered listing pages
 * (MoviesPage, TVShowsPage, GenrePage, CountryPage).
 *
 * When the user types, we fire a real full-catalog search against the
 * phimapi search endpoint (returns matches across ALL pages), then
 * client-filter the results down to the current filter context so the
 * user only sees matches relevant to the page they're on.
 *
 * `active` is true whenever the debounced query is non-empty — pages
 * use it to switch between "paginated listing view" and "search view".
 */
export function useContextualSearch(
  keyword: string,
  ctx: ContextFilter,
  limit = 64,
) {
  const debounced = useDebounce(keyword, 400);
  const trimmed = debounced.trim();

  const query = useSearchMovies({
    keyword: trimmed,
    limit,
  });

  const results = useMemo<MovieListItem[]>(() => {
    if (!trimmed) return [];
    const items = (query.data?.items ?? []) as SearchItem[];
    return items.filter((m) => {
      if (ctx.type && m.type && m.type !== ctx.type) return false;
      if (
        ctx.countrySlug &&
        m.country &&
        !m.country.some((c) => c.slug === ctx.countrySlug)
      ) {
        return false;
      }
      if (
        ctx.categorySlug &&
        m.category &&
        !m.category.some((c) => c.slug === ctx.categorySlug)
      ) {
        return false;
      }
      return true;
    });
  }, [query.data, trimmed, ctx.type, ctx.countrySlug, ctx.categorySlug]);

  return {
    active: trimmed.length > 0,
    isLoading: query.isLoading && trimmed.length > 0,
    results,
  };
}
