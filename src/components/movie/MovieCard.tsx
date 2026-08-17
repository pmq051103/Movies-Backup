import { useState, memo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
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
    l.includes('vietsub') ||
    l.includes('phụ đề') ||
    l.includes('phu de') ||
    l.includes('pđ')
  )
    return { label: 'PĐ', className: 'bg-[#5e6070]' };
  return null;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { t: _t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const posterSrc = getMoviePoster(movie.poster_url, movie.thumb_url);
  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;

  // Format episode badge: "Hoàn Tất (24/24)" → "24/24", "Tập 12" + total "32" → "12/32", "Full" → "Full"
  const episodeBadge = (() => {
    const ep = movie.episode_current;
    if (!ep) return '';
    const match = ep.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    const tapMatch = ep.match(/[Tt]ập\s*(\d+)/);
    if (tapMatch) {
      const current = tapMatch[1];
      const total = (movie as any).episode_total;
      if (total && total !== '?' && total !== '0') return `${current}/${total}`;
      return `Tập ${current}`;
    }
    if (ep === 'Full') return 'Full';
    return ep;
  })();

  const source = (movie as MovieListItem & { _source?: string })._source;
  const detailUrl =
    source && source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;

  const pin = langPin(movie.lang);

  return (
    <Link
      to={detailUrl}
      className="group relative block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]"
      aria-label={movie.name}
      title={movie.name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-2.5">
        {/* Poster — aspect ratio 2:3, rounded-xl like tophim */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.03]">
          <img
            src={posterSrc}
            alt={movie.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={onImgError}
          />

          {/* Gold circle quality badge — top-left */}
          {movie.quality && (
            <span className="absolute left-[.35rem] top-[.35rem] z-[2] flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-[#0f111a] shadow-[0_0_0_2px_rgba(0,0,0,0.3)] [background:linear-gradient(220deg,#FFD166,#FFF)]">
              {movie.quality === '4K' ? '4K' : movie.quality.toUpperCase().slice(0, 2)}
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
              className={`absolute bottom-0 left-1/2 z-[3] -translate-x-1/2 rounded-t-[.3rem] px-1.5 py-[2px] text-[10px] font-bold text-white shadow-[0_0_5px_2px_rgba(0,0,0,0.1)] ${pin.className}`}
            >
              {pin.label}
            </span>
          )}

          {/* Hover play overlay */}
          <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full [background:linear-gradient(39deg,#fecf59,#fff1cc)] text-[#0f111a] shadow-[0_5px_10px_5px_rgba(255,218,125,0.15)]">
              <FaPlay className="h-4 w-4 translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Title below image — tophim style: left-aligned, no card bg */}
        <div className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-normal leading-snug text-white transition-colors group-hover:text-[#ffd166]">
            {movie.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
            {[movie.origin_name && movie.origin_name !== movie.name ? movie.origin_name : null, movie.year > 0 ? movie.year : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        {/* Custom hover tooltip showing full name + original name */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, delay: 0.25 }}
              className="pointer-events-none absolute left-1/2 top-0 z-30 w-[92%] -translate-x-1/2 -translate-y-2 rounded-lg border border-white/10 bg-[#0f111a]/95 px-3 py-2 text-center shadow-2xl backdrop-blur-md"
              style={{ transform: 'translate(-50%, calc(-100% - 6px))' }}
            >
              <p className="text-sm font-semibold text-white">{movie.name}</p>
              {movie.origin_name && movie.origin_name !== movie.name && (
                <p className="mt-0.5 text-xs italic text-gray-400">
                  {movie.origin_name}
                </p>
              )}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-[#0f111a]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
};

export default memo(MovieCard);
