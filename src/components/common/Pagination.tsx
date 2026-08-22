import { useState, useCallback, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Compact "Trang [n] / total" pager — a round prev/next arrow on each side
 * of a pill containing an editable page-number field. Replaces the old
 * numbered-buttons layout everywhere Pagination is used (Country, Genre,
 * Now Playing, Movies, TV Shows, Anime listing pages).
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(String(currentPage));

  // Keep the input in sync when the page changes from outside (arrows,
  // browser back/forward, filters resetting to page 1, etc).
  useEffect(() => {
    setDraft(String(currentPage));
  }, [currentPage]);

  const commit = useCallback(() => {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(parsed, 1), Math.max(totalPages, 1));
    if (clamped !== currentPage) onPageChange(clamped);
    setDraft(String(clamped));
  }, [draft, currentPage, totalPages, onPageChange]);

  const handlePrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const arrowClasses =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]';

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-4"
      aria-label={t('pagination.navigation')}
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className={arrowClasses}
        aria-label={t('pagination.previous')}
      >
        <FaChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex h-12 items-center gap-2.5 rounded-full bg-white/5 px-5 text-base text-gray-300">
        <span className="font-medium text-gray-400">{t('pagination.page', 'Trang')}</span>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label={t('pagination.goToPage', { page: currentPage })}
          className="h-8 w-12 rounded-md bg-white/10 text-center text-base font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]"
        />
        <span className="text-gray-400">/ {totalPages}</span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className={arrowClasses}
        aria-label={t('pagination.next')}
      >
        <FaChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;
