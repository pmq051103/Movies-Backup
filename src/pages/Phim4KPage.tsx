import { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { Premium4KCard } from '@/components/movie';
import { LoadingOverlay, Pagination } from '@/components/common';
import { useVsmov4K } from '@/hooks';
import { ROUTES } from '@/constants';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const PER_PAGE = 24;

/**
 * Dedicated "Phim 4K" catalog page. Sourced from vsmov's `/danh-sach/4k`
 * endpoint and rendered with the premium landscape card used on the
 * homepage showcase, laid out as a responsive grid (2 cols on mobile,
 * 6 on desktop) with client-side pagination of 24 items per page.
 */
export default function Phim4KPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useVsmov4K(1);

  const allMovies = useMemo(() => data?.items ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil(allMovies.length / PER_PAGE));
  const pageMovies = useMemo(
    () => allMovies.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [allMovies, page],
  );

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Phim 4K Ultra HD - Không Gian Phim</title>
        <meta
          name="description"
          content="Kho phim 4K Ultra HD chất lượng cao nhất, xem phim 4K online miễn phí tại Không Gian Phim."
        />
        <meta property="og:title" content="Phim 4K Ultra HD - Không Gian Phim" />
        <meta
          property="og:url"
          content={`https://khonggianphim.online${ROUTES.PHIM_4K}`}
        />
        <link
          rel="canonical"
          href={`https://khonggianphim.online${ROUTES.PHIM_4K}`}
        />
      </Helmet>

      <motion.div
        className="min-h-screen bg-[#0d0e15] text-white"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Premium page header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-lg bg-[linear-gradient(135deg,#ffd166,#ff9f43)] px-2.5 py-1 text-sm font-black tracking-wide text-[#1a1205] shadow-[0_2px_12px_rgba(255,159,67,0.5)]">
                4K
              </span>
              <h1 className="text-2xl font-bold sm:text-3xl">Phim 4K Ultra HD</h1>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Trải nghiệm hình ảnh sắc nét nhất với kho phim 4K độ phân giải 2160p.
            </p>
          </div>

          {isLoading ? (
            <LoadingOverlay />
          ) : isError ? (
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
          ) : allMovies.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400">{t('common.noResults', 'Không có phim nào.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                {pageMovies.map((movie) => (
                  <Premium4KCard key={movie._id ?? movie.slug} movie={movie} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
