import { useState, useCallback, useRef, useLayoutEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FaPlay, FaHeart, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES, QUERY_KEYS } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import { getMovieDetailFromSource, type MovieSource } from '@/api/dualSource';
import { useFavoriteStore } from '@/store';
import type { MovieListItem } from '@/types';

interface MovieHoverWrapperProps {
  movie: MovieListItem;
  /** The base card visual (poster card, landscape card, etc). */
  children: ReactNode;
  /** Extra classes on the outer wrapping element. */
  className?: string;
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Wraps any base card visual with the Netflix-style hover preview popup —
 * same behavior as MovieCard's built-in popup (fetch full detail, float a
 * portal-rendered landscape preview above everything, watch/favorite/info
 * actions), just decoupled from MovieCard's own poster-card markup so
 * other layouts (e.g. the landscape carousel cards) can reuse it.
 */
const MovieHoverWrapper: React.FC<MovieHoverWrapperProps> = ({ movie, children, className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const isFav = useFavoriteStore((s) => s.favorites.some((f) => f.slug === movie.slug));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const backdropSrc = getMoviePoster(movie.thumb_url, movie.poster_url);
  const rating = movie.tmdb?.vote_average ? parseFloat(String(movie.tmdb.vote_average)) : null;

  const source: MovieSource =
    ((movie as MovieListItem & { _source?: MovieSource })._source) ?? 'phimapi';
  const detailUrl =
    source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;
  const watchUrl = `${ROUTES.WATCH}/${movie.slug}${source !== 'phimapi' ? `?src=${source}` : ''}`;

  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, 'card', movie.slug, source],
    queryFn: () => getMovieDetailFromSource(movie.slug, source),
    staleTime: 10 * 60 * 1000,
    enabled: isHovered,
  });

  const detail = detailData?.movie;

  const episodeBadge = (() => {
    const ep = detail?.episode_current ?? movie.episode_current;
    if (!ep) return '';
    const match = ep.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    const tapMatch = ep.match(/[Tt]ập\s*(\d+)/);
    if (tapMatch) {
      const current = tapMatch[1];
      const total = detail?.episode_total ?? (movie as any).episode_total;
      if (total && total !== '?' && total !== '0') return `${current}/${total}`;
      return `Tập ${current}`;
    }
    if (ep === 'Full') return 'Full';
    return ep;
  })();

  const quality = detail?.quality || movie.quality;
  const time = detail?.time || '';
  const description = detail?.content ? stripHtml(detail.content) : '';
  const genres = detail?.category ?? [];

  // Hide "Xem ngay" for trailer-only / not-yet-released titles. Default to
  // showing it until the detail (with episodes) has loaded, so movies that
  // DO have episodes don't flicker the button off.
  const hasEpisodes = (() => {
    if (!detailData) return true;
    if (detail?.status === 'trailer') return false;
    return (
      detailData.episodes?.some((ep) =>
        ep.server_data?.some(
          (sd) => sd.link_embed?.trim() || sd.link_m3u8?.trim(),
        ),
      ) ?? false
    );
  })();

  const computePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width * 1.4, 380), Math.min(440, window.innerWidth - 16));
    let left = rect.left + rect.width / 2 - width / 2;
    const margin = 8;
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);

    const estimatedHeight = width * (9 / 16) + 260;
    const headerClearance = 88;
    const bottomMargin = 16;
    const maxTop = window.innerHeight - bottomMargin - estimatedHeight;
    const rawTop = rect.top - 12;
    const top = Math.min(Math.max(rawTop, headerClearance), Math.max(headerClearance, maxTop));

    setPos({ left, top, width });
  }, []);

  const onHoverStart = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      computePos();
      setIsHovered(true);
    }, 200);
  }, [computePos]);

  const onHoverEnd = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setIsHovered(false), 180);
  }, []);

  useLayoutEffect(() => {
    if (!isHovered) return;
    const handler = () => computePos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isHovered, computePos]);

  return (
    <div
      ref={wrapRef}
      className={`group relative ${className ?? ''}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {children}

      {createPortal(
        <AnimatePresence>
          {isHovered && pos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onMouseEnter={onHoverStart}
              onMouseLeave={onHoverEnd}
              onClick={() => navigate(detailUrl)}
              style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }}
              className="z-[100] hidden cursor-pointer overflow-hidden rounded-[18px] bg-[#2B2F42] shadow-[0_24px_60px_rgba(0,0,0,0.75)] md:block"
            >
              <div className="relative aspect-video w-full bg-black">
                <img
                  src={backdropSrc}
                  alt={movie.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={onImgError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2F42] via-[#2B2F42]/20 to-transparent" />

                {!detailData && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-[#ffd166]"
                    />
                  </span>
                )}
              </div>

              <div className="p-4">
                <p className="truncate text-base font-bold text-white">{movie.name}</p>
                {movie.origin_name && movie.origin_name !== movie.name && (
                  <p className="truncate text-sm font-medium text-[#ffd166]">{movie.origin_name}</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {hasEpisodes && (
                    <Link
                      to={watchUrl}
                      onClick={(e) => e.stopPropagation()}
                      title={t('movie.watchNow')}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold text-[#0f1115] transition-transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(39deg, #fecf59, #fff1cc)' }}
                    >
                      <FaPlay className="h-3 w-3" />
                      {t('movie.watchNow')}
                    </Link>
                  )}

                  <button
                    type="button"
                    title={t('movie.addFavorite')}
                    aria-label={t('movie.addFavorite')}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-90"
                  >
                    <FaHeart className={`h-4 w-4 ${isFav ? 'text-[#ffd166]' : ''}`} />
                  </button>

                  <Link
                    to={detailUrl}
                    onClick={(e) => e.stopPropagation()}
                    title={t('movie.moreInfo')}
                    aria-label={t('movie.moreInfo')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <FaInfoCircle className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/85">
                  {rating !== null && rating > 0 && (
                    <span className="flex items-center overflow-hidden rounded border border-[#f5c518]/60">
                      <span className="bg-[#f5c518] px-1.5 py-0.5 text-black">IMDb</span>
                      <span className="bg-[#f5c518]/10 px-1.5 py-0.5">{rating.toFixed(1)}</span>
                    </span>
                  )}
                  {movie.year > 0 && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {movie.year}
                    </span>
                  )}
                  {quality && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {quality.toUpperCase()}
                    </span>
                  )}
                  {episodeBadge && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {episodeBadge}
                    </span>
                  )}
                  {time && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {time}
                    </span>
                  )}
                </div>

                {description && (
                  <p className="mt-2.5 line-clamp-3 text-[12px] leading-snug text-white/70">
                    {description}
                  </p>
                )}

                {genres.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {genres.slice(0, 4).map((g) => (
                      <Link
                        key={g.slug ?? g.name}
                        to={`${ROUTES.GENRES}/${g.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border border-white/15 bg-white/5 px-2 py-[2px] text-[11px] text-white/75 transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default MovieHoverWrapper;
