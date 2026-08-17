import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaFire } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import type { MovieListItem } from '@/types';

interface SidebarProps {
  topRated?: MovieListItem[];
  trending?: MovieListItem[];
  hotWeekly?: MovieListItem[];
}

/**
 * Right sidebar for homepage — "Đánh giá cao" / "Hot Trong Tuần" /
 * "Thịnh Hành" ranked lists with small poster thumbnails, like
 * motchille.tv. (The old "Tổng số phim hiện tại" card was removed —
 * that number now lives in the "Đầu phim duy nhất" stat on the
 * StatsBlock up top, so it wasn't needed twice.)
 */
const Sidebar: React.FC<SidebarProps> = ({ topRated = [], trending = [], hotWeekly = [] }) => {
  const { t } = useTranslation();

  return (
    <aside className="space-y-8">
      {/* Top Rated */}
      {topRated.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#18181b]/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <span className="h-4 w-1 rounded-full bg-[#ffd166]" />
            {t('home.topRated', 'Đánh giá cao')}
          </h3>
          <div className="space-y-3">
            {topRated.slice(0, 8).map((movie, idx) => {
              const rating = movie.tmdb?.vote_average
                ? parseFloat(String(movie.tmdb.vote_average))
                : null;
              // Format episode
              const ep = movie.episode_current || '';
              const epMatch = ep.match(/(\d+)\s*\/\s*(\d+)/);
              const tapMatch = ep.match(/[Tt]ập\s*(\d+)/);
              const epLabel = epMatch
                ? `${epMatch[1]}/${epMatch[2]}`
                : tapMatch
                  ? (movie as any).episode_total && (movie as any).episode_total !== '?'
                    ? `Tập ${tapMatch[1]}/${(movie as any).episode_total}`
                    : `Tập ${tapMatch[1]}`
                  : ep === 'Full' ? 'Full' : ep;

              return (
                <Link
                  key={movie.slug}
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="group flex items-start gap-3 rounded-lg p-1 transition-colors hover:bg-white/5"
                >
                  {/* Rank number */}
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                    idx < 3 ? 'bg-[#ffd166] text-[#0f111a]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Small poster */}
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800">
                    <img
                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                      alt={movie.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={onImgError}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-200 group-hover:text-[#ffd166]">
                      {movie.name}
                    </p>
                    {movie.origin_name && movie.origin_name !== movie.name && (
                      <p className="line-clamp-1 text-[11px] text-gray-500">
                        {movie.origin_name}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                      {rating !== null && rating > 0 && (
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <FaStar className="h-2 w-2" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {epLabel && (
                        <span className="text-green-400">{epLabel}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Hot Trong Tuần */}
      {hotWeekly.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#18181b]/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <FaFire className="h-3.5 w-3.5 text-[#ffd166]" />
            Hot Trong Tuần
          </h3>
          <div className="space-y-3">
            {hotWeekly.slice(0, 10).map((movie, idx) => {
              const rating = movie.tmdb?.vote_average
                ? parseFloat(String(movie.tmdb.vote_average))
                : null;
              return (
                <Link
                  key={movie.slug}
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="group flex items-start gap-3 rounded-lg p-1 transition-colors hover:bg-white/5"
                >
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                    idx < 3 ? 'bg-gradient-to-br from-[#ffd166] to-[#ffb53d] text-[#0f111a]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800">
                    <img
                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                      alt={movie.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={onImgError}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-200 group-hover:text-[#ffd166]">
                      {movie.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                      {rating !== null && rating > 0 && (
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <FaStar className="h-2 w-2" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {movie.year > 0 && <span>{movie.year}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending / Hot */}
      {trending.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#18181b]/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <FaFire className="h-3.5 w-3.5 text-[#ffd166]" />
            {t('home.trending', 'Thịnh Hành')}
          </h3>
          <div className="space-y-3">
            {trending.slice(0, 10).map((movie, idx) => {
              const rating = movie.tmdb?.vote_average
                ? parseFloat(String(movie.tmdb.vote_average))
                : null;

              return (
                <Link
                  key={movie.slug}
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="group flex items-start gap-3 rounded-lg p-1 transition-colors hover:bg-white/5"
                >
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                    idx < 3 ? 'bg-[#ffd166] text-[#0f111a]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800">
                    <img
                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                      alt={movie.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={onImgError}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-200 group-hover:text-[#ffd166]">
                      {movie.name}
                    </p>
                    {movie.origin_name && movie.origin_name !== movie.name && (
                      <p className="line-clamp-1 text-[11px] text-gray-500">
                        {movie.origin_name}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                      {rating !== null && rating > 0 && (
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <FaStar className="h-2 w-2" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {movie.year > 0 && <span>{movie.year}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </aside>
  );
};

export default memo(Sidebar);
