import { useMemo, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { t } = useTranslation();

  const pages = useMemo(() => {
    if (totalPages <= 1) return [];

    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    // Show all pages if total is small
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
      return items;
    }

    // Always show first page
    items.push(1);

    // Ellipsis after page 1 if gap exists
    if (currentPage > 3) {
      items.push('ellipsis-start');
    }

    // Pages around the current page (1 neighbor on each side)
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      items.push(i);
    }

    // Ellipsis before last page if gap exists
    if (currentPage < totalPages - 2) {
      items.push('ellipsis-end');
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const baseClasses =
    'min-w-[40px] h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]';

  return (
    <nav
      className="flex items-center justify-center gap-1.5 mt-8"
      aria-label={t('pagination.navigation')}
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className={`${baseClasses} ${
          currentPage <= 1
            ? 'bg-white/5 text-gray-600 opacity-50 cursor-not-allowed'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-label={t('pagination.previous')}
      >
        <FaChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Page numbers */}
      {pages.map((page) => {
        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
          return (
            <span
              key={page}
              className="min-w-[40px] h-10 flex items-center justify-center text-gray-500 text-sm select-none"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        const isCurrent = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={isCurrent}
            className={`${baseClasses} ${
              isCurrent
                ? 'bg-[#ffd166] text-[#0f111a] cursor-default'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            aria-label={t('pagination.goToPage', { page })}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className={`${baseClasses} ${
          currentPage >= totalPages
            ? 'bg-white/5 text-gray-600 opacity-50 cursor-not-allowed'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-label={t('pagination.next')}
      >
        <FaChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
};

export default Pagination;
