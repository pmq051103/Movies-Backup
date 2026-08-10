import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlay, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/constants";
import { getMoviePoster, truncateText, onImgError } from "@/utils";
import { SectionTitle } from "@/components/common";
import type { MovieListItem } from "@/types";

interface MovieCarouselProps {
  movies: MovieListItem[];
  title?: string;
}

const SCROLL_AMOUNT = 820;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies, title }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, movies]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: offset, behavior: "smooth" });
  }, []);

  if (!movies.length) return null;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative py-4"
    >
      {/* Optional title */}
      {title && <SectionTitle title={title} className="px-4 md:px-0" />}

      <div className="group/carousel relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white/70 transition-colors hover:text-white md:flex"
            aria-label={t("common.scrollLeft")}
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white/70 transition-colors hover:text-white md:flex"
            aria-label={t("common.scrollRight")}
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable container — wider landscape cards using thumb_url */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-2 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {movies.map((movie) => {
            const rating = movie.tmdb?.vote_average
              ? parseFloat(String(movie.tmdb.vote_average))
              : null;

            return (
              <motion.div
                key={movie._id}
                variants={itemVariants}
                className="min-w-[260px] max-w-[320px] flex-shrink-0 sm:min-w-[280px] md:min-w-[320px]"
              >
                <Link
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="group block overflow-hidden rounded-xl bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={movie.name}
                >
                  {/* Thumbnail — landscape 16:9 */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={getMoviePoster(movie.thumb_url, movie.poster_url)}
                      alt={movie.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={onImgError}
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/50">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <FaPlay className="h-4 w-4 translate-x-0.5" />
                      </motion.div>
                    </div>

                    {/* Rating pill */}
                    {rating !== null && rating > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold text-yellow-400 backdrop-blur-sm">
                        <FaStar className="h-3 w-3" />
                        <span>{rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Year pill */}
                    {movie.year > 0 && (
                      <span className="absolute top-2 right-2 rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {movie.year}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-red-400">
                      {truncateText(movie.name, 40)}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {movie.origin_name && movie.origin_name !== movie.name
                        ? movie.origin_name
                        : movie.year > 0
                          ? String(movie.year)
                          : ""}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default memo(MovieCarousel);
