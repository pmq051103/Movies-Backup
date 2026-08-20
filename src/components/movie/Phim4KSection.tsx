import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import Premium4KCard from '@/components/movie/Premium4KCard';
import { SectionTitle } from '@/components/common';
import type { MovieListItem } from '@/types';

interface Phim4KSectionProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  limit?: number;
}

const SCROLL_AMOUNT = 700;

/**
 * Premium 4K showcase row — a horizontal carousel of wide landscape
 * Premium4KCard tiles, set on a subtle dark gradient panel to make the
 * high-end content stand out from the standard poster rows.
 */
const Phim4KSection: React.FC<Phim4KSectionProps> = ({
  title,
  movies,
  viewAllLink,
  limit,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, movies]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: 'smooth',
    });
  }, []);

  const items = limit ? movies.slice(0, limit) : movies;
  if (!items.length) return null;

  return (
    <section className="relative">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="group/row relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollLeft')}
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollRight')}
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto overflow-y-visible pb-2 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((movie) => (
            <div
              key={movie._id ?? movie.slug}
              className="w-[260px] flex-shrink-0 snap-start sm:w-[300px] lg:w-[340px]"
            >
              <Premium4KCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(Phim4KSection);
