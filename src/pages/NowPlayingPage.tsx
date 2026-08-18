import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes } from 'react-icons/fa';

import { MovieGrid, FilterSidebar } from '@/components/movie';
import { Pagination } from '@/components/common';
import { useMoviesBySlug } from '@/hooks';
import type { FilterState, FilterParams } from '@/types';

/**
 * Now Playing page — uses the `/v1/api/danh-sach/phim-chieu-rap` endpoint
 * which returns all movies tagged as "chiếu rạp" with full server-side
 * pagination and filter support.
 */

function parseSearchParams(searchParams: URLSearchParams): FilterState {
  return {
    genre: searchParams.get('genre') || undefined,
    country: searchParams.get('country') || undefined,
    year: searchParams.get('year') || undefined,
    status: searchParams.get('status') || undefined,
    sortField: searchParams.get('sortField') || undefined,
    sortType: (searchParams.get('sortType') as 'asc' | 'desc') || undefined,
    page: Number(searchParams.get('page')) || 1,
  };
}

function filtersToSearchParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.genre) params.genre = filters.genre;
  if (filters.country) params.country = filters.country;
  if (filters.year) params.year = String(filters.year);
  if (filters.status) params.status = filters.status;
  if (filters.sortField) params.sortField = filters.sortField;
  if (filters.sortType) params.sortType = filters.sortType;
  if (filters.page && filters.page > 1) params.page = String(filters.page);
  return params;
}

function filtersToApiParams(filters: FilterState): FilterParams {
  return {
    page: filters.page,
    category: filters.genre,
    country: filters.country,
    year: filters.year,
    status: filters.status,
    sort_field: filters.sortField,
    sort_type: filters.sortType,
  };
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } },
};

export default function NowPlayingPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const apiParams = useMemo(() => filtersToApiParams(filters), [filters]);
  const { data, isLoading, isError } = useMoviesBySlug('phim-chieu-rap', apiParams);

  const displayMovies = data?.items ?? [];

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setSearchParams(filtersToSearchParams(newFilters), { replace: true });
      setSidebarOpen(false);
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const updated = { ...filters, page };
      setSearchParams(filtersToSearchParams(updated), { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, setSearchParams],
  );

  return (
    <>
      <Helmet>
        <title>{t('seo.nowPlayingTitle')}</title>
        <meta name="description" content="Phim chiếu rạp mới nhất 2026, phim rạp hay, xem phim chiếu rạp online miễn phí tại Không Gian Phim." />
        <meta property="og:title" content={t('seo.nowPlayingTitle')} />
        <meta property="og:description" content="Phim chiếu rạp mới nhất, xem online miễn phí chất lượng cao." />
        <meta property="og:url" content="https://khonggianphim.online/phim-chieu-rap" />
        <link rel="canonical" href="https://khonggianphim.online/phim-chieu-rap" />
      </Helmet>

      <motion.div
        className="min-h-screen bg-gray-950 text-white"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('nav.nowPlaying')}</h1>

          {/* Filter toggle */}
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 md:hidden"
              aria-label={t('filter.filters')}
            >
              <FaFilter className="h-3.5 w-3.5" />
              {t('filter.filters')}
            </button>
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 md:block">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                className="sticky top-20"
              />
            </aside>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarOpen(false)}
                  />
                  <motion.aside
                    className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-gray-950 p-4 md:hidden"
                    variants={sidebarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{t('filter.title')}</h2>
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                        aria-label={t('common.close')}
                      >
                        <FaTimes className="h-4 w-4" />
                      </button>
                    </div>
                    <FilterSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                    />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Main content */}
            <main className="min-w-0 flex-1">
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="mb-4 text-gray-400">{t('common.error')}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              ) : (
                <>
                  <MovieGrid movies={displayMovies} isLoading={isLoading} />

                  {data?.pagination && (
                    <Pagination
                      currentPage={data.pagination.currentPage}
                      totalPages={data.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </motion.div>
    </>
  );
}
