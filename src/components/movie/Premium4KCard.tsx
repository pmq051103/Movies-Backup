import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaStar } from 'react-icons/fa';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import type { MovieSource } from '@/api/dualSource';
import MovieHoverWrapper from '@/components/movie/MovieHoverWrapper';
import type { MovieListItem } from '@/types';

interface Premium4KCardProps {
  movie: MovieListItem;
}

/** Build language pins (PĐ / VS / TM / LT) from the movie's `lang` field. */
function buildLangPins(lang?: string) {
  const raw = (lang || '').toLowerCase();
  const pins: { label: string; className: string }[] = [];
  if (/lồng|long tieng|\blt\b/.test(raw)) pins.push({ label: 'LT', className: 'bg-[#1667cf]' });
  if (/thuyết|thuyet|\btm\b/.test(raw)) pins.push({ label: 'TM', className: 'bg-[#2ca35d]' });
  if (/vietsub|phụ đề|phu de|\bpđ\b|\bpd\b|\bvs\b/.test(raw))
    pins.push({ label: 'VS', className: 'bg-[#5e6070]' });
  if (pins.length === 0 && raw) pins.push({ label: 'VS', className: 'bg-[#5e6070]' });
  return pins;
}

/**
 * Premium landscape card for the "Phim 4K" showcase. Distinct from the
 * standard poster cards: wide 16:9 backdrop, glossy 4K badge, language
 * pins, gradient overlay with title/meta and a play affordance. Wrapped
 * in the shared MovieHoverWrapper so it gets the same Netflix-style hover
 * preview popup as every other card.
 */
const Premium4KCard: React.FC<Premium4KCardProps> = ({ movie }) => {
  const backdropSrc = getMoviePoster(movie.thumb_url, movie.poster_url);
  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;
  const langPins = buildLangPins(movie.lang);

  const source: MovieSource =
    ((movie as MovieListItem & { _source?: MovieSource })._source) ?? 'phimapi';
  const detailUrl =
    source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;

  return (
    <MovieHoverWrapper movie={movie}>
      <Link
        to={detailUrl}
        className="block"
        aria-label={movie.name}
        title={movie.name}
      >
        <div className="group/4k relative overflow-hidden rounded-2xl bg-[#0f1115] shadow-lg transition-transform duration-300 hover:-translate-y-1">
          {/* Backdrop */}
          <div className="relative aspect-video w-full bg-black">
            <img
              src={backdropSrc}
              alt={movie.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover/4k:scale-105"
              onError={onImgError}
            />

            {/* Darkening gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

            {/* 4K badge — top left, glossy */}
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[linear-gradient(135deg,#ffd166,#ff9f43)] px-2 py-0.5 text-[10px] font-black tracking-wide text-[#1a1205] shadow-[0_2px_10px_rgba(255,159,67,0.5)]">
              4K
            </span>

            {/* Language pins — top left, below the 4K badge */}
            {langPins.length > 0 && (
              <div className="absolute left-2.5 top-9 flex gap-1">
                {langPins.map((pin) => (
                  <span
                    key={pin.label}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${pin.className}`}
                  >
                    {pin.label}
                  </span>
                ))}
              </div>
            )}

            {/* Rating — top right */}
            {rating !== null && rating > 0 && (
              <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-[#ffd166] backdrop-blur">
                <FaStar className="h-2.5 w-2.5" />
                {rating.toFixed(1)}
              </span>
            )}

            {/* Play affordance — center on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/4k:opacity-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd166]/95 text-[#0f1115] shadow-lg">
                <FaPlay className="h-4 w-4 translate-x-0.5" />
              </span>
            </div>

            {/* Title + meta over the bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="line-clamp-1 text-[14px] font-bold text-white drop-shadow">
                {movie.name}
              </p>
              {movie.origin_name && movie.origin_name !== movie.name && (
                <p className="line-clamp-1 text-[11px] font-medium text-[#ffd166]/90">
                  {movie.origin_name}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/85">
                {movie.year > 0 && (
                  <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5">
                    {movie.year}
                  </span>
                )}
                <span className="rounded border border-[#ffd166]/40 bg-[#ffd166]/10 px-1.5 py-0.5 text-[#ffd166]">
                  2160p
                </span>
                {movie.episode_current && movie.episode_current !== 'Full' && (
                  <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5">
                    {movie.episode_current}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </MovieHoverWrapper>
  );
};

export default memo(Premium4KCard);
