import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import MovieCard from '@/components/movie/MovieCard';
import type { MovieListItem } from '@/types';

interface DetectiveSectionProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  limit?: number;
}

const SCROLL_AMOUNT = 600;

/**
 * "Hồ Sơ Vụ Án Chưa Khép Lại" — a detective/mystery themed row for Conan
 * anime. Deliberately styled DIFFERENTLY from the plain MovieRow: a dark
 * noir gradient panel with a faint radial "spotlight" glow and a
 * magnifying-glass eyebrow, evoking a case-file/investigation vibe.
 *
 * No borders anywhere (per request). The cards themselves are the standard
 * `MovieCard`, so the hover popup + description behaves exactly like the
 * rest of the site.
 */
const DetectiveSection: React.FC<DetectiveSectionProps> = ({
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
    <section className="relative overflow-hidden rounded-2xl bg-[radial-gradient(120%_140%_at_15%_0%,#15243a_0%,#0c1424_45%,#07090f_100%)] px-4 py-6 sm:px-6 sm:py-7">
      {/* Noir spotlight glow — the "case being examined under a lamp" feel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl [background:radial-gradient(circle,#5eead4,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full opacity-[0.12] blur-3xl [background:radial-gradient(circle,#818cf8,transparent_70%)]"
      />
      {/* Subtle scan-line texture for the investigation vibe. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#ffffff_3px,#ffffff_4px)]"
      />

      {/* Header — magnifying-glass eyebrow + noir gradient title. */}
      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#5eead4]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5eead4]">
            <FaSearch className="h-2.5 w-2.5" />
            Hồ sơ mật · Đang điều tra
          </div>
          <h2 className="bg-gradient-to-r from-white via-[#c7d2fe] to-[#5eead4] bg-clip-text text-lg font-black leading-tight text-transparent sm:text-xl lg:text-[22px]">
            {title}
          </h2>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            aria-label={t('common.seeAll')}
            className="group flex shrink-0 items-center gap-1 text-[13px] font-medium text-white/70 transition-colors hover:text-[#5eead4]"
          >
            <span className="hidden sm:inline">{t('common.seeAll')}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 sm:hidden">
              <FaChevronRight className="h-3 w-3" />
            </span>
            <FaChevronRight className="hidden h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:inline-block" />
          </Link>
        )}
      </div>

      <div className="group/row relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-[#07090f] to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollLeft')}
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-[#07090f] to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollRight')}
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="relative flex gap-3 overflow-x-auto overflow-y-visible pb-2 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((movie) => (
            <div
              key={movie._id ?? movie.slug}
              className="w-[140px] flex-shrink-0 snap-start sm:w-[175px] md:w-[195px] lg:w-[215px] xl:w-[235px]"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(DetectiveSection);
