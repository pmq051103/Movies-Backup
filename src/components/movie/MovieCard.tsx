import { useState, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FaPlay,
  FaStar,
  FaHeart,
  FaThumbsUp,
  FaInfoCircle,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES, QUERY_KEYS } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import { getMovieDetailFromSource, type MovieSource } from '@/api/dualSource';
import { useFavoriteStore } from '@/store';
import type { MovieListItem } from '@/types';

export interface MovieCardProps {
  movie: MovieListItem;
  index?: number;
}

/** Map a language label to the CôBe Phim colored bottom pin.
 *  Vietsub → grey "PĐ", Thuyết minh → green "TM", Lồng tiếng → blue "LT". */
function langPin(lang?: string): { label: string; className: string } | null {
  if (!lang) return null;
  const l = lang.toLowerCase();
  if (l.includes('thuyết minh') || l.includes('thuyet minh') || l.includes('tm'))
    return { label: 'TM', className: 'bg-[#2ca35d]' };
  if (l.includes('lồng tiếng') || l.includes('long tieng') || l.includes('lt'))
    return { label: 'LT', className: 'bg-[#1667cf]' };
  if (
    l.includes('vietsub') ||
    l.includes('phụ đề') ||
    l.includes('phu de') ||
    l.includes('pđ')
  )
    return { label: 'PĐ', className: 'bg-[#5e6070]' };
  return null;
}

/** Strip HTML tags from the API `content` for a clean description. */
function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const isFavorite = useFavoriteStore((s) => s.isFavorite);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const posterSrc = getMoviePoster(movie.poster_url, movie.thumb_url);
  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;

  const source: MovieSource =
    ((movie as MovieListItem & { _source?: MovieSource })._source) ?? 'phimapi';
  const detailUrl =
    source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;
  const watchUrl = `${ROUTES.WATCH}/${movie.slug}${source !== 'phimapi' ? `?src=${source}` : ''}`;

  // Fetch the full detail (description, genres, countries) lazily on hover,
  // cached by react-query so repeat hovers are instant.
  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, 'card', movie.slug, source],
    queryFn: () => getMovieDetailFromSource(movie.slug, source),
    enabled: isHovered,
    staleTime: 10 * 60 * 1000,
  });

  const detail = detailData?.movie;

  // Format episode badge: "Hoàn Tất (24/24)" → "24/24", "Tập 12" + total "32" → "12/32", "Full" → "Full"
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

  const pin = langPin(detail?.lang ?? movie.lang);
  const quality = detail?.quality || movie.quality;
  const time = detail?.time || '';
  const description = detail?.content ? stripHtml(detail.content) : '';
  const genres = detail?.category ?? [];
  const countries = detail?.country ?? [];

  const onHoverStart = useCallback(() => setIsHovered(true), []);
  const onHoverEnd = useCallback(() => setIsHovered(false), []);

  return (
    <div
      className="group relative rounded-xl focus-within:ring-2 focus-within:ring-[#ffd166]"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="flex flex-col gap-2.5">
        {/* Poster — aspect ratio 2:3, rounded-xl like tophim */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.03] bg-gray-900">
          <Link to={detailUrl} aria-label={movie.name} title={movie.name} className="absolute inset-0 z-[1]">
            <img
              src={posterSrc}
              alt={movie.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={onImgError}
            />
          </Link>

          {/* Gold circle quality badge — top-left */}
          {quality && (
            <span className="absolute left-[.35rem] top-[.35rem] z-[2] flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-[#0f111a] shadow-[0_0_0_2px_rgba(0,0,0,0.3)] [background:linear-gradient(220deg,#FFD166,#FFF)]">
              {quality === '4K' ? '4K' : quality.toUpperCase().slice(0, 2)}
            </span>
          )}

          {/* Rating — top-right (IMDb gold) */}
          {rating !== null && rating > 0 && (
            <span className="absolute right-[.3rem] top-[.3rem] z-[2] flex items-center gap-0.5 rounded-[.28rem] bg-[#fecf59] px-1 py-[1px] text-[10px] font-bold text-[#0f111a]">
              <FaStar className="h-2 w-2" />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Episode badge — bottom-left */}
          {episodeBadge && (
            <span className="absolute bottom-[.3rem] left-[.3rem] z-[2] rounded-[.28rem] bg-black/70 px-1.5 py-[2px] text-[10px] font-bold text-white backdrop-blur-sm">
              {episodeBadge}
            </span>
          )}

          {/* LT/TM/PĐ pin — bottom center */}
          {pin && (
            <span
              className={`absolute bottom-0 left-1/2 z-[2] -translate-x-1/2 rounded-t-[.3rem] px-1.5 py-[2px] text-[10px] font-bold text-white shadow-[0_0_5px_2px_rgba(0,0,0,0.1)] ${pin.className}`}
            >
              {pin.label}
            </span>
          )}

          {/* Hover preview — Netflix-style: 3 action buttons + title + meta +
              description + genres + countries, framed on the poster image. */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(detailUrl)}
                className="absolute inset-0 z-[3] flex cursor-pointer flex-col justify-end bg-[linear-gradient(to_top,rgba(10,11,16,0.98)_0%,rgba(10,11,16,0.82)_55%,rgba(10,11,16,0.15)_100%)]"
              >
                {/* Action buttons */}
                <div className="flex items-center gap-2 px-2 pb-1.5">
                  <Link
                    to={watchUrl}
                    title={t('movie.watchNow')}
                    aria-label={t('movie.watchNow')}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#0f111a] transition-transform hover:scale-110"
                    style={{ background: 'linear-gradient(39deg, #fecf59, #fff1cc)' }}
                  >
                    <FaPlay className="h-3 w-3 translate-x-0.5" />
                  </Link>

                  <button
                    type="button"
                    title={t('movie.addFavorite')}
                    aria-label={t('movie.addFavorite')}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie);
                    }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm transition-all hover:border-white hover:scale-110 active:scale-75"
                  >
                    <FaHeart
                      className={`h-3.5 w-3.5 transition-colors ${
                        isFavorite(movie.slug) ? 'fill-current text-[#fecf59]' : 'text-white'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    title={liked ? t('common.unlike') : t('common.like')}
                    aria-label={liked ? t('common.unlike') : t('common.like')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiked((v) => !v);
                    }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm transition-all hover:border-white hover:scale-110 active:scale-75"
                  >
                    <FaThumbsUp
                      className={`h-3.5 w-3.5 transition-colors ${
                        liked ? 'fill-current text-[#fecf59]' : 'text-white'
                      }`}
                    />
                  </button>

                  <Link
                    to={detailUrl}
                    title={t('movie.moreInfo')}
                    aria-label={t('movie.moreInfo')}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm transition-all hover:border-white hover:scale-110"
                  >
                    <FaInfoCircle className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Title */}
                <Link
                  to={detailUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="line-clamp-1 px-2 pb-0.5 text-[13px] font-semibold leading-snug text-white transition-colors hover:text-[#ffd166]"
                >
                  {movie.name}
                </Link>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 pb-1 text-[10px] text-white/85">
                  {rating !== null && rating > 0 && (
                    <span className="flex items-center gap-0.5 font-bold text-[#fecf59]">
                      <FaStar className="h-2 w-2" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                  {movie.year > 0 && <span className="text-white/70">{movie.year}</span>}
                  {time && <span className="text-white/70">{time}</span>}
                  {quality && (
                    <span className="rounded border border-white/25 px-1 py-[1px] font-semibold text-[#fecf59]">
                      {quality}
                    </span>
                  )}
                  {episodeBadge && <span className="text-white/70">{episodeBadge}</span>}
                </div>

                {/* Description */}
                {description && (
                  <p className="line-clamp-2 px-2 pb-1 text-[10px] leading-snug text-white/75">
                    {description}
                  </p>
                )}

                {/* Genres + countries */}
                {(genres.length > 0 || countries.length > 0) && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 pb-2">
                    {genres.slice(0, 3).map((g) => (
                      <Link
                        key={g.slug ?? g.name}
                        to={`${ROUTES.GENRES}/${g.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border border-white/20 bg-white/5 px-1.5 py-[1px] text-[9px] text-white/80 transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                      >
                        {g.name}
                      </Link>
                    ))}
                    {countries.slice(0, 2).map((c) => (
                      <Link
                        key={c.slug ?? c.name}
                        to={`${ROUTES.COUNTRIES}/${c.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border border-white/20 bg-white/5 px-1.5 py-[1px] text-[9px] text-white/80 transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Loading hint while detail is being fetched */}
                {!detailData && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="block h-3 w-3 rounded-full border-2 border-white/30 border-t-[#ffd166]"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title below image — tophim style: left-aligned, no card bg */}
        <div className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-normal leading-snug text-white transition-colors group-hover:text-[#ffd166]">
            <Link to={detailUrl}>{movie.name}</Link>
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
            {[movie.origin_name && movie.origin_name !== movie.name ? movie.origin_name : null, movie.year > 0 ? movie.year : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(MovieCard);
