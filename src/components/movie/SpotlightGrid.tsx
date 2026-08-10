import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaStar, FaPlay } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/constants";
import { getMoviePoster } from "@/utils";
import { SectionTitle } from "@/components/common";
import type { MovieListItem } from "@/types";

interface SpotlightGridProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
}

/**
 * Motchill-style asymmetric spotlight grid: one large hero card (16:9)
 * with rich overlay info paired with a 2×2 grid of smaller cards next to
 * it. Perfect for "Phim đề cử" / "Đang hot" sections that should stand
 * out from the standard horizontal rows.
 *
 * Requires at least 5 movies; caller should slice to first 5.
 */
const SpotlightGrid: React.FC<SpotlightGridProps> = ({
  title,
  movies,
  viewAllLink,
}) => {
  const { t } = useTranslation();
  const [failedSlugs, setFailedSlugs] = useState<Set<string>>(new Set());

  // Filter out movies whose images failed (CDN 404), then take first 5
  const available = movies.slice(0, 7).filter((m) => !failedSlugs.has(m.slug));
  const items = available.slice(0, 5);
  if (items.length < 5) return null;
  const [hero, ...rest] = items;

  const handleImgError = (slug: string) => {
    setFailedSlugs((prev) => new Set(prev).add(slug));
  };
  const heroRating = hero.tmdb?.vote_average
    ? parseFloat(String(hero.tmdb.vote_average))
    : null;

  return (
    <section className="w-full">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="always-dark grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hero card — landscape, large */}
        <Link
          to={`${ROUTES.MOVIE_DETAIL}/${hero.slug}`}
          className="group relative block aspect-video overflow-hidden rounded-xl bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={hero.name}
        >
          <img
            src={getMoviePoster(hero.thumb_url, hero.poster_url)}
            alt={hero.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => handleImgError(hero.slug)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <h3 className="line-clamp-2 text-xl font-bold text-white drop-shadow-lg sm:text-3xl">
              {hero.name}
            </h3>
            {hero.origin_name && hero.origin_name !== hero.name && (
              <p className="mt-1 line-clamp-1 text-sm text-gray-300 sm:text-base">
                {hero.origin_name}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              {hero.year > 0 && (
                <span className="rounded bg-white/15 px-2 py-0.5 text-white backdrop-blur">
                  {hero.year}
                </span>
              )}
              {heroRating !== null && heroRating > 0 && (
                <span className="flex items-center gap-1 rounded bg-yellow-500/90 px-2 py-0.5 font-semibold text-black">
                  <FaStar className="h-3 w-3" />
                  {heroRating.toFixed(1)}
                </span>
              )}
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="ml-auto hidden items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white group-hover:flex"
              >
                <FaPlay className="h-3 w-3" />
                {t("hero.watchNow")}
              </motion.span>
            </div>
          </div>
        </Link>

        {/* 2x2 mini cards */}
        <div className="grid grid-cols-2 gap-4">
          {rest.map((m) => {
            const rating = m.tmdb?.vote_average
              ? parseFloat(String(m.tmdb.vote_average))
              : null;
            return (
              <Link
                key={m._id ?? m.slug}
                to={`${ROUTES.MOVIE_DETAIL}/${m.slug}`}
                className="group relative block aspect-video overflow-hidden rounded-lg bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={m.name}
              >
                <img
                  src={getMoviePoster(m.thumb_url, m.poster_url)}
                  alt={m.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={() => handleImgError(m.slug)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h4 className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
                    {m.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-300">
                    {m.year > 0 && <span>{m.year}</span>}
                    {rating !== null && rating > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <FaStar className="h-2.5 w-2.5" />
                          {rating.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default memo(SpotlightGrid);
