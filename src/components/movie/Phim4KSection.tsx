import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBolt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import Premium4KCard from '@/components/movie/Premium4KCard';
import type { MovieListItem } from '@/types';

interface Phim4KSectionProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  limit?: number;
}

const SCROLL_AMOUNT = 500;

/**
 * Premium 4K showcase row — same portrait Premium4KCard tiles as the rest
 * of the site, but housed in its own dark glass panel (radial glow, thin
 * gold↔cyan border, a small "ULTRA HD" eyebrow above the title) so the row
 * reads as its own tier at a glance — the same idea as the Anime spotlight
 * or the cinema carousel each having a distinct look, just built around a
 * "premium transfer" identity instead of a big hero or ticket-stub card.
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
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101019] px-4 py-6 sm:px-6 sm:py-7">
      {/* Ambient glow — top-left gold, bottom-right cyan, the panel's own
          lighting instead of the flat background every other row sits on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full opacity-[0.16] blur-3xl [background:radial-gradient(circle,#ffd166,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full opacity-[0.14] blur-3xl [background:radial-gradient(circle,#4dd0ff,transparent_70%)]"
      />

      {/* Header — eyebrow + gradient title, distinct from the plain
          SectionTitle used everywhere else. */}
      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#ffd166]/25 bg-[#ffd166]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffd166]">
            <FaBolt className="h-2.5 w-2.5" />
            Ultra HD · 2160p
          </div>
          <h2 className="bg-gradient-to-r from-[#fff1cc] via-[#ffd166] to-[#4dd0ff] bg-clip-text text-lg font-black leading-tight text-transparent sm:text-xl lg:text-[22px]">
            {title}
          </h2>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            aria-label={t('common.seeAll')}
            className="group hidden shrink-0 items-center gap-1 text-[13px] font-medium text-white/70 transition-colors hover:text-[#ffd166] sm:inline-flex"
          >
            <span>{t('common.seeAll')}</span>
            <FaChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="group/row relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-[#101019] to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollLeft')}
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-[#101019] to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            aria-label={t('common.scrollRight')}
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="relative flex gap-4 overflow-x-auto overflow-y-visible pb-2 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((movie) => (
            <div
              key={movie._id ?? movie.slug}
              className="w-[150px] flex-shrink-0 snap-start sm:w-[190px] lg:w-[220px] xl:w-[240px]"
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