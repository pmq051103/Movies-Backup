import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaStar, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants';
import { getMoviePoster } from '@/utils';
import type { MovieListItem } from '@/types';

interface PromoBannerProps {
  /** Movie to feature — uses thumb_url for landscape image. */
  movie: MovieListItem;
  /** Optional gradient accent color. Defaults to red. */
  accent?: 'red' | 'blue' | 'purple' | 'green';
}

const accentMap = {
  red: 'from-red-900/80 via-red-900/40',
  blue: 'from-blue-900/80 via-blue-900/40',
  purple: 'from-purple-900/80 via-purple-900/40',
  green: 'from-emerald-900/80 via-emerald-900/40',
};

const btnAccentMap = {
  red: 'bg-red-600 hover:bg-red-500',
  blue: 'bg-blue-600 hover:bg-blue-500',
  purple: 'bg-purple-600 hover:bg-purple-500',
  green: 'bg-emerald-600 hover:bg-emerald-500',
};

/**
 * Full-width promotional banner — Netflix / Galaxy Play style.
 * Shows a landscape thumbnail with gradient overlay, movie info,
 * and action buttons. Place between homepage sections for visual impact.
 */
const PromoBanner: React.FC<PromoBannerProps> = ({ movie, accent = 'red' }) => {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);

  // Don't render banner if movie has no image or image failed to load
  const hasRealImage =
    (typeof movie.thumb_url === 'string' && movie.thumb_url.length > 0) ||
    (typeof movie.poster_url === 'string' && movie.poster_url.length > 0);
  if (!hasRealImage || imgFailed) return null;

  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;

  const imgSrc = getMoviePoster(movie.thumb_url, movie.poster_url);
  const categories = (movie as any).category as
    | { name: string; slug: string }[]
    | undefined;

  return (
    <section className="always-dark relative overflow-hidden rounded-xl">
      {/* Background image — full width */}
      <div className="relative aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1]">
        <img
          src={imgSrc}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />

        {/* Gradient overlays */}
        <div className={`absolute inset-0 bg-gradient-to-r ${accentMap[accent]} to-transparent`} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-transparent to-gray-950" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end px-4 pb-6 sm:items-center sm:px-6 lg:px-8">
          <div className="max-w-xl space-y-3">
            {/* Genre badges */}
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat.slug}
                    className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h2 className="line-clamp-2 text-2xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl">
              {movie.name}
            </h2>

            {/* Subtitle row: origin name + year + rating */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
              {movie.origin_name && movie.origin_name !== movie.name && (
                <span className="line-clamp-1">{movie.origin_name}</span>
              )}
              {movie.year > 0 && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-medium">
                  {movie.year}
                </span>
              )}
              {rating !== null && rating > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-400">
                  <FaStar className="h-3 w-3" />
                  {rating.toFixed(1)}
                </span>
              )}
              {(movie as any).time && (
                <span className="text-xs text-gray-400">{(movie as any).time}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                to={`${ROUTES.WATCH}/${movie.slug}`}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors ${btnAccentMap[accent]}`}
              >
                <FaPlay className="h-3 w-3" />
                {t('hero.watchNow')}
              </Link>
              <Link
                to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <FaInfoCircle className="h-3.5 w-3.5" />
                {t('hero.moreInfo')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(PromoBanner);
