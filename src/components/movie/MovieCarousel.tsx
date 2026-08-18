import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlay, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/constants";
import { getMoviePoster, truncateText, onImgError } from "@/utils";
import { SectionTitle } from "@/components/common";
import MovieHoverWrapper from "./MovieHoverWrapper";
import type { MovieListItem } from "@/types";

type MovieCarouselVariant = "default" | "cinema" | "upcoming";

interface MovieCarouselProps {
  movies: MovieListItem[];
  title?: string;
  viewAllLink?: string;
  /** Max cards to render. Defaults to showing everything passed in. */
  limit?: number;
  /**
   * "cinema" — landscape card with PĐ/TM/LT language pins + a poster
   * thumbnail overlapping the bottom edge of the backdrop, for
   * theatrical-release rows.
   * "upcoming" — landscape card with a "Sắp chiếu" tag, for trailer-only
   * titles that haven't released yet.
   * "default" — the original rating/year pill style.
   */
  variant?: MovieCarouselVariant;
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

// Language pins (PĐ / TM / LT) — same detection rules used on MovieCard,
// duplicated here to keep this component's card layout self-contained.
function getLangPins(lang: string | undefined) {
  const raw = (lang || "").toLowerCase();
  const pins: { label: string; className: string }[] = [];
  if (/lồng|long tieng|\blt\b/.test(raw)) pins.push({ label: "LT", className: "bg-[#1667cf]" });
  if (/thuyết|thuyet|\btm\b/.test(raw)) pins.push({ label: "TM", className: "bg-[#2ca35d]" });
  if (/vietsub|phụ đề|phu de|\bpđ\b|\bpd\b/.test(raw))
    pins.push({ label: "PĐ", className: "bg-[#5e6070]" });
  if (pins.length === 0 && raw) pins.push({ label: "PĐ", className: "bg-[#5e6070]" });
  return pins;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({
  movies,
  title,
  viewAllLink,
  limit,
  variant = "default",
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const items = limit ? movies.slice(0, limit) : movies;
  const isLandscapePoster = variant === "cinema";

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
  }, [updateScrollState, items]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: offset, behavior: "smooth" });
  }, []);

  if (!items.length) return null;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative py-4"
    >
      {/* Optional title */}
      {title && <SectionTitle title={title} viewAllLink={viewAllLink} className="px-4 md:px-0" />}

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

        {/* Scrollable container — wider landscape cards using thumb_url.
            Extra top/bottom padding on the "cinema" variant so the
            overlapping poster thumbnail (sticking out below each backdrop)
            has room to breathe without being clipped or crowding the row
            above/below. */}
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto px-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
            isLandscapePoster ? "pb-6 pt-1" : "pb-2"
          }`}
        >
          {items.map((movie) => {
            const rating = movie.tmdb?.vote_average
              ? parseFloat(String(movie.tmdb.vote_average))
              : null;
            const langPins = variant === "cinema" ? getLangPins(movie.lang) : [];

            return (
              <motion.div
                key={movie._id}
                variants={itemVariants}
                className="min-w-[260px] max-w-[320px] flex-shrink-0 sm:min-w-[280px] md:min-w-[320px]"
              >
                <MovieHoverWrapper movie={movie}>
                  <Link
                    to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label={movie.name}
                  >
                    {/* Backdrop wrapper — intrinsic 16:9 height, no background
                        box of its own. Only the image inside is clipped and
                        rounded; the poster thumbnail below is a sibling so
                        it isn't cut off by that clip. */}
                    <div className="relative aspect-video">
                      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gray-900">
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
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd166] text-[#0f111a] opacity-0 shadow-lg shadow-black/30 transition-opacity duration-300 group-hover:opacity-100"
                          >
                            <FaPlay className="h-4 w-4 translate-x-0.5" />
                          </motion.div>
                        </div>

                        {variant === "cinema" ? (
                          <>
                            {/* Language pins — top-left (PĐ / TM / LT) */}
                            {langPins.length > 0 && (
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                {langPins.map((p) => (
                                  <span
                                    key={p.label}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white shadow ${p.className}`}
                                  >
                                    {p.label}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Year pill */}
                            {movie.year > 0 && (
                              <span className="absolute top-2 right-2 rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                {movie.year}
                              </span>
                            )}
                          </>
                        ) : variant === "upcoming" ? (
                          <span className="absolute top-2 left-2 rounded bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {t("home.comingSoon", "Sắp chiếu")}
                          </span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      {/* Poster thumbnail — 50/50 straddles the bottom edge
                          of the backdrop: anchored at top:100% of this
                          aspect-video wrapper (i.e. the backdrop's bottom
                          edge), then pulled up by exactly half its own
                          height so it's half over the image, half below. */}
                      {variant === "cinema" && (
                        <div className="absolute left-3 top-full z-10 h-16 w-11 -translate-y-1/2 overflow-hidden rounded-md border-2 border-[#0f111a] bg-gray-800 shadow-lg sm:h-20 sm:w-14">
                          <img
                            src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={onImgError}
                          />
                        </div>
                      )}
                    </div>

                    {/* Title + meta — plain text, no card background/box */}
                    <div className={variant === "cinema" ? "mt-2 pl-16 sm:pl-20" : "mt-2"}>
                      <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#ffd166]">
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
                </MovieHoverWrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default memo(MovieCarousel);
