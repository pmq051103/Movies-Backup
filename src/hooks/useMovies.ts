// ==========================================================================
// Legacy/compat barrel — some components (`components/search/SearchModal.tsx`,
// `components/search/FilterSidebar.tsx`) import query hooks directly from
// `@/hooks/useMovies`. Re-export the canonical implementations from
// `useMovieQueries.ts` so both import paths stay in sync and there is a
// single source of truth for query keys, caching, and transforms.
// ==========================================================================

export {
  useLatestMovies,
  useMovieDetail,
  useSearchMovies,
  useMoviesBySlug,
  useGenres,
  useCountries,
  useMoviesByGenre,
  useMoviesByCountry,
  useMoviesInGenre,
  useMoviesInCountry,
  useMovies,
  useTVShows,
  useCatalogStats,
} from './useMovieQueries';
