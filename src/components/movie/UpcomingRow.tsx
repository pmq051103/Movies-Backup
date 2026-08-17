import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import { SectionTitle } from '@/components/common';
import type { MovieListItem } from '@/types';

interface UpcomingRowProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  /** How many to show. Defaults to 12. */
  limit?: number;
}

/**
 * "Phim sắp cập nhật" — horizontal-scroll row (no grid) for titles that
 * only have a trailer so far (status: "trailer"). Same flex/overflow-x
 * pattern as the Top 10 rows, but each card is tagged with a "Trailer"
 * badge instead of a rank number / episode badge, since there's nothing
 * to watch yet besides the trailer.
 */
const UpcomingRow: React.FC<UpcomingRowProps> = ({
  title,
  movies,
  viewAllLink,
  limit = 12,
}) => {
  const items = movies.slice(0, limit);
  if (items.length === 0) return null;

  // vsmov/ophim source-tagged items need ?src= appended so the detail
  // page resolves the right catalog entry (same convention as MovieCard).
  const detailUrlFor = (m: MovieListItem) => {
    const source = (m as MovieListItem & { _source?: string })._source;
    return source && source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${m.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${m.slug}`;
  };

  return (
    <section className="w-full">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((m) => (
          <Link
            key={m._id ?? m.slug}
            to={detailUrlFor(m)}
            className="group relative flex-shrink-0"
            aria-label={`Trailer: ${m.name}`}
            title={m.name}
          >
            <div className="relative aspect-[2/3] w-28 overflow-hidden rounded-lg bg-[#18181b] sm:w-36">
              <img
                src={getMoviePoster(m.poster_url, m.thumb_url)}
                alt={m.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={onImgError}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffd166] text-[#0f111a] shadow-lg">
                  <FaPlay className="h-4 w-4 translate-x-0.5" />
                </div>
              </div>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-[#ffd166]/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f111a] backdrop-blur">
                Trailer
              </span>
              {m.year > 0 && (
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  {m.year}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-[7rem] truncate text-sm font-medium text-gray-300 sm:max-w-[9rem]">
              {m.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default memo(UpcomingRow);
