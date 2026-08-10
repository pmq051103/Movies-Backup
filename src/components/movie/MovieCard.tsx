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
    // "Hoàn Tất (24/24)" or "Hoàn Tất(24/24)"
    const match = ep.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    // "Tập 12" + episode_total
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

  // When the movie came from vsmov or ophim (dual/multi-source search),
  // append ?src=<source> so the detail page loads the correct film even
  // when multiple APIs have different movies under the same slug.
  const source = (movie as MovieListItem & { _source?: string })._source;
  const detailUrl =
    source && source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;

  return (
    <Link
      to={detailUrl}
      className="group relative block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      aria-label={movie.name}
      title={movie.name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative flex flex-col overflow-hidden rounded-lg bg-gray-900 shadow-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Poster — aspect ratio 2:3 */}
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <img
            src={posterSrc}
            alt={movie.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={onImgError}
          />

          {/* Hover overlay with centered play button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40">
              <FaPlay className="h-4 w-4 translate-x-0.5" />
            </div>
          </div>

          {/* Top-left badges: year + rating */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {movie.quality && (
              <span className="w-fit rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {movie.quality}
              </span>
            )}
            {movie.lang && (
              <span className="w-fit rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {movie.lang}
              </span>
            )}
          </div>

          {/* Top-right badge: rating */}
          {rating !== null && rating > 0 && (
            <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-yellow-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <FaStar className="h-2 w-2" />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Bottom-left badge: episode count */}
          <div className="absolute bottom-1.5 left-1.5 flex gap-1">
            {episodeBadge && (
              <span className="rounded bg-green-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {episodeBadge}
              </span>
            )}
            {movie.year > 0 && (
              <span className="rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {movie.year}
              </span>
            )}
          </div>
        </div>

        {/* Title below image — truncated single line */}
        <div className="p-2">
          <h3 className="truncate text-sm font-medium text-gray-200 transition-colors group-hover:text-red-400">
            {movie.name}
          </h3>
        </div>

        {/* Custom hover tooltip showing full name + original name.
            Renders on top of the card (absolutely positioned, above z-index
            of neighbouring cards), fades in with Framer Motion. Uses a
            slight delay so brief cursor passes don't flash it. */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, delay: 0.25 }}
              className="pointer-events-none absolute left-1/2 top-0 z-30 w-[92%] -translate-x-1/2 -translate-y-2 rounded-lg border border-gray-700 bg-gray-900/95 px-3 py-2 text-center shadow-2xl backdrop-blur-md"
              style={{ transform: 'translate(-50%, calc(-100% - 6px))' }}
            >
              <p className="text-sm font-semibold text-white">{movie.name}</p>
              {movie.origin_name && movie.origin_name !== movie.name && (
                <p className="mt-0.5 text-xs italic text-gray-400">
                  {movie.origin_name}
                </p>
              )}
              {/* Tooltip arrow */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-gray-700 bg-gray-900"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
};

export default memo(MovieCard);
