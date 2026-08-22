import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes } from 'react-icons/fa';

import { MovieGrid, FilterSidebar } from '@/components/movie';
import { Pagination } from '@/components/common';
import { useFilteredList } from '@/hooks';
import type { FilterState, FilterParams } from '@/types';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } },
};

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

interface TopicListPageProps {
  /** Page heading + document title. */
  title: string;
  /** `/v1/api/danh-sach/[slug]` list to read from. Defaults to the
   *  "phim-moi-cap-nhat" catch-all (all movies) when only the fixed
   *  params define the topic (e.g. Top IMDb, Cổ Trang Trung Quốc). */
  slug?: string;
  /** Canonical path segment (e.g. "/phim-thuyet-minh"). */
  canonicalPath: string;
  /** Meta description. */
  description: string;
  /**
   * Params that always define this topic and take precedence over the
   * user's filter selections (e.g. `{ sort_field: 'tmdb.vote_average' }`
   * for Top IMDb, `{ category: 'co-trang', country: 'trung-quoc' }` for
   * Cổ Trang Trung Quốc).
   */
  fixedParams?: FilterParams;
}

/**
 * Shared catalog page with the same filter sidebar as the search page.
 * Powers the themed topic pages (Top IMDb, Thuyết Minh, Lồng Tiếng, Cổ
 * Trang Trung Quốc). Filters live in the URL so they survive refresh /
 * back-forward, and are merged with `fixedParams` (which win) before the
 * request so the page's identity can't be filtered away.
 */
export default function TopicListPage({
  title,
  slug = 'phim-moi-cap-nhat',
  canonicalPath,
  description,
  fixedParams,
}: TopicListPageProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const apiParams = useMemo<FilterParams>(
    () => ({
      page: filters.page,
      category: filters.genre,
      country: filters.country,
      year: filters.year,
      status: filters.status,
      sort_field: filters.sortField,
      sort_type: filters.sortType,
      ...fixedParams,
    }),
    [filters, fixedParams],
  );

  const { data, isLoading, isError } = useFilteredList(slug, apiParams);

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
      setSearchParams(filtersToSearchParams({ ...filters, page }), { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, setSearchParams],
  );

  const canonical = `https://khonggianphim.online${canonicalPath}`;

  return (
    <>
      <Helmet>
        <title>{`${title} - Không Gian Phim`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} - Không Gian Phim`} />
        <meta property="og:url" content={canonical} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <motion.div
        className="min-h-screen bg-gray-950 text-white"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{title}</h1>

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
                    <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
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

                  {data?.pagination && data.pagination.totalPages > 1 && (
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
