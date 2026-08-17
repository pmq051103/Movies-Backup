import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaPlay, FaHeart, FaInfoCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/constants";
import { getMoviePoster, onImgError } from "@/utils";
import { useFavoriteStore } from "@/store";
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
 * tophim.top-style "Top 10" ranking row — posters lean into each other in
 * alternating pairs (like two dominoes tipping toward one another), each
 * paired with a bold rank number + title underneath. Hovering a poster
 * (desktop) opens a floating preview popup with backdrop, quick actions
 * and quality/rating badges, mirroring tophim.top's card preview.
 */
const TopRankingRow: React.FC<TopRankingRowProps> = ({
  title,
  movies,
  viewAllLink,
  limit = 10,
  showRating = true,
}) => {
  const { t } = useTranslation();
  const isFavorite = useFavoriteStore((s) => s.isFavorite);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const [hovered, setHovered] = useState<number | null>(null);

  const items = movies.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      {/* Extra top padding reserves room for the hover popup to float
          above the row without being clipped by the scroll container. */}
      <div className="no-scrollbar -mx-4 flex items-end gap-5 overflow-x-auto overflow-y-visible px-4 pb-2 pt-40 sm:mx-0 sm:gap-7 sm:px-0 sm:pt-48">
        {items.map((m, idx) => {
          const rank = idx + 1;
          const leaning = idx % 2 === 0 ? "-rotate-6" : "rotate-6";
          const isOpen = hovered === idx;
          const rating = m.tmdb?.vote_average
            ? parseFloat(String(m.tmdb.vote_average))
            : null;
          const edgeAlign =
            idx === 0
              ? "left-0 translate-x-0"
              : idx === items.length - 1
                ? "right-0 left-auto translate-x-0"
                : "left-1/2 -translate-x-1/2";

          return (
            <div
              key={m._id ?? m.slug}
              className="group relative flex-shrink-0"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered((cur) => (cur === idx ? null : cur))}
            >
              {/* Rotated poster — pairs lean into one another */}
              <Link
                to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
                aria-label={`${rank}. ${m.name}`}
                className="relative z-0 block"
              >
                <div
                  className={`relative aspect-[2/3] w-24 overflow-hidden rounded-lg bg-gray-900 shadow-lg transition-all duration-300 ease-out sm:w-28 ${leaning} group-hover:rotate-0 group-hover:scale-[1.08] group-hover:shadow-2xl group-hover:shadow-black/60`}
                  style={{ transformOrigin: "bottom center" }}
                >
                  <img
                    src={getMoviePoster(m.poster_url, m.thumb_url)}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={onImgError}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  {m.quality && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {m.quality.toUpperCase()}
                    </span>
                  )}
                  {showRating && rating !== null && rating > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-yellow-400 backdrop-blur-sm">
                      <FaStar className="h-2.5 w-2.5" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>

              {/* Rank number + title */}
              <Link
                to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
                className="mt-2 flex max-w-[9.5rem] items-start gap-2 sm:max-w-[11rem]"
              >
                <span
                  className="shrink-0 select-none text-2xl font-black italic leading-none text-transparent sm:text-3xl"
                  style={{ WebkitTextStroke: "1.5px #ffd166" }}
                >
                  {rank}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">
                    {m.name}
                  </span>
                  {m.origin_name && (
                    <span className="block truncate text-xs text-white/50">
                      {m.origin_name}
                    </span>
                  )}
                </span>
              </Link>

              {/* Hover preview popup (desktop only) */}
              <div
                className={`pointer-events-none absolute bottom-full z-30 mb-3 hidden w-64 origin-bottom overflow-hidden rounded-xl border border-white/10 bg-[#181820] shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-200 md:block ${edgeAlign} ${
                  isOpen
                    ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                    : "translate-y-2 scale-95 opacity-0"
                }`}
              >
                <div className="relative aspect-video w-full bg-black">
                  <img
                    src={getMoviePoster(m.thumb_url, m.poster_url)}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={onImgError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181820] via-transparent to-transparent" />
                </div>

                <div className="p-3">
                  <p className="truncate text-sm font-bold text-white">{m.name}</p>
                  {m.origin_name && (
                    <p className="truncate text-xs font-medium text-[#ffd166]">
                      {m.origin_name}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      to={`${ROUTES.WATCH}/${m.slug}`}
                      className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#ffd166] text-xs font-bold text-[#0f1115] transition-colors hover:bg-[#ffe099]"
                    >
                      <FaPlay className="h-2.5 w-2.5" />
                      {t("movie.watchNow")}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(m);
                      }}
                      aria-label={t("nav.favorites")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                    >
                      <FaHeart
                        className={`h-3 w-3 ${
                          isFavorite(m.slug) ? "text-[#ffd166]" : ""
                        }`}
                      />
                    </button>
                    <Link
                      to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
                      aria-label={t("movie.moreInfo")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                    >
                      <FaInfoCircle className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/80">
                    {rating !== null && rating > 0 && (
                      <span className="flex items-center overflow-hidden rounded border border-[#01B4E4]/50">
                        <span className="bg-[#01B4E4] px-1.5 py-0.5 text-white">TMDb</span>
                        <span className="bg-[#01B4E4]/10 px-1.5 py-0.5 text-white">
                          {rating.toFixed(1)}
                        </span>
                      </span>
                    )}
                    {m.year > 0 && (
                      <span className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5">
                        {m.year}
                      </span>
                    )}
                    {m.quality && (
                      <span className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5">
                        {m.quality.toUpperCase()}
                      </span>
                    )}
                    {m.episode_current && (
                      <span className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5">
                        {m.episode_current}
                      </span>
                    )}
                    {m.lang && (
                      <span className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5">
                        {m.lang}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default memo(TopRankingRow);
