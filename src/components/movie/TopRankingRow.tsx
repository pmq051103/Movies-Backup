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
 * outlined rank digit (1..10) behind the poster, giving the whole strip
 * a magazine feel that stands out from the flat horizontal rows.
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

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((m, idx) => (
          <Link
            key={m._id ?? m.slug}
            to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
            className="group relative flex-shrink-0"
            aria-label={`${idx + 1}. ${m.name}`}
          >
            <div className="flex items-end gap-1">
              {/* Giant rank number */}
              <span
                aria-hidden="true"
                className="pointer-events-none select-none text-[6rem] font-black leading-none tracking-tighter text-transparent sm:text-[8rem]"
                style={{
                  WebkitTextStroke: "3px #ffd166",
                  color: "transparent",
                }}
              >
                {idx + 1}
              </span>

              {/* Poster */}
              <div className="relative aspect-[2/3] w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900 sm:w-32">
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
        ))}
      </div>
    </section>
  );
};

export default memo(TopRankingRow);
