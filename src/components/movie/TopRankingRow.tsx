import { memo } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

import { ROUTES } from "@/constants";
import { getMoviePoster, onImgError } from "@/utils";
import { SectionTitle } from "@/components/common";
import type { MovieListItem } from "@/types";

interface TopRankingRowProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  /** How many to show. Defaults to 10 (Netflix Top 10 style). */
  limit?: number;
  /** Show TMDB star rating badge on each poster. */
  showRating?: boolean;
}

/**
 * Netflix "Top 10" style ranking row — each card renders with a huge
 * skewed outlined rank digit (1..10) and a poster that overlaps it on the
 * diagonal. Two thin diagonal accent lines cross behind the digit, giving
 * the whole strip that dynamic "two slants meeting" magazine feel that
 * stands out from the flat horizontal rows.
 */
const TopRankingRow: React.FC<TopRankingRowProps> = ({
  title,
  movies,
  viewAllLink,
  limit = 10,
  showRating = false,
}) => {
  const items = movies.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="no-scrollbar -mx-4 flex items-end gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((m, idx) => {
          const rank = idx + 1;
          return (
            <Link
              key={m._id ?? m.slug}
              to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
              className="group relative flex-shrink-0"
              aria-label={`${rank}. ${m.name}`}
            >
              <div className="flex items-end">
                {/* Giant skewed rank digit + two diagonal crossing lines */}
                <div className="relative z-0 -mr-8 sm:-mr-10">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none block select-none text-[6rem] font-black leading-[0.72] tracking-tighter text-transparent transition-colors duration-300 group-hover:[color:rgba(255,209,102,0.25)] sm:text-[8rem]"
                    style={{
                      WebkitTextStroke: "3px rgba(254, 207, 89, 0.9)",
                      transform: "skewX(-12deg)",
                    }}
                  >
                    {rank}
                  </span>

                  {/* Two diagonal lines crossing into each other */}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rotate-45 bg-gradient-to-b from-transparent via-[#ffd166]/40 to-transparent" />
                    <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 -rotate-45 bg-gradient-to-b from-transparent via-[#ffd166]/40 to-transparent" />
                  </span>
                </div>

                {/* Poster overlapping the digit at a diagonal */}
                <div className="relative z-10 aspect-[2/3] w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-lg transition-transform duration-300 group-hover:-rotate-1 group-hover:shadow-2xl sm:w-32">
                  <img
                    src={getMoviePoster(m.poster_url, m.thumb_url)}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={onImgError}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
                  {showRating && (m as any).tmdb?.vote_average > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-yellow-400 backdrop-blur-sm">
                      <FaStar className="h-2.5 w-2.5" />
                      {Number((m as any).tmdb.vote_average).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-2 max-w-[9rem] truncate text-sm font-medium text-gray-300 sm:max-w-[11rem]">
                {m.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default memo(TopRankingRow);
