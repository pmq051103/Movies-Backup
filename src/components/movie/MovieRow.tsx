import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import MovieCard from '@/components/movie/MovieCard';
import { SectionTitle } from '@/components/common';
import type { MovieListItem } from '@/types';

interface MovieRowProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  /** How many items to show. Defaults to all. */
  limit?: number;
}

const SCROLL_AMOUNT = 600;

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, viewAllLink, limit }) => {
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
    const offset = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  const items = limit ? movies.slice(0, limit) : movies;
  if (!items.length) return null;

  return (
    <section className="relative py-4">
      {/* Section header */}
      <SectionTitle title={title} viewAllLink={viewAllLink} className="px-4 md:px-0" />

      {/* Carousel wrapper */}
      <div className="group/row relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollLeft')}
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollRight')}
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overflow-y-visible px-4 pb-2 pt-2 snap-x snap-mandatory md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((movie) => (
            <div
              key={movie._id ?? movie.slug}
              className="min-w-[140px] max-w-[180px] flex-shrink-0 snap-start sm:min-w-[160px] md:min-w-[180px]"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(MovieRow);
