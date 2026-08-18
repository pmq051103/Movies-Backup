import { memo, useCallback, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaPlay, FaHeart, FaInfoCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES, QUERY_KEYS } from "@/constants";
import { getMoviePoster, onImgError } from "@/utils";
import { getMovieDetailFromSource, type MovieSource } from "@/api/dualSource";
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

/** Strip HTML tags from the API `content` for a clean description. */
function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Diagonal top-edge clips (dovetail): left poster of a pair slopes down to
// the right, right poster slopes down to the left.
const CLIP_LEFT = "polygon(0 0, 100% 11%, 100% 100%, 0 100%)";
const CLIP_RIGHT = "polygon(0 11%, 100% 0, 100% 100%, 0 100%)";

interface TopRankingCardProps {
  movie: MovieListItem;
  rank: number;
  showRating: boolean;
}

const TopRankingCard: React.FC<TopRankingCardProps> = ({
  movie: m,
  rank,
  showRating,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isFavorite = useFavoriteStore((s) => s.isFavorite);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const [isHovered, setIsHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const leanRight = rank % 2 === 1; // Top 1,3,5… lean toward the right
  // Keep the diagonal top edge even on hover (only the scale/lift changes).
  const clip = leanRight ? CLIP_LEFT : CLIP_RIGHT;

  const source: MovieSource =
    ((m as MovieListItem & { _source?: MovieSource })._source) ?? "phimapi";
  const detailUrl =
    source !== "phimapi"
      ? `${ROUTES.MOVIE_DETAIL}/${m.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${m.slug}`;
  const watchUrl = `${ROUTES.WATCH}/${m.slug}${source !== "phimapi" ? `?src=${source}` : ""}`;

  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, "toprank", m.slug, source],
    queryFn: () => getMovieDetailFromSource(m.slug, source),
    enabled: isHovered,
    staleTime: 10 * 60 * 1000,
  });
  const detail = detailData?.movie;
  const description = detail?.content ? stripHtml(detail.content) : "";
  const genres = detail?.category ?? [];

  // Age rating chip (e.g. "T16"). Prefer detail data; fall back to a sensible
  // default so the chip always shows like the reference site.
  const ageLabel = (() => {
    const raw =
      (detail as (typeof detail & { rating?: string }) | undefined)?.rating ??
      "";
    const match = String(raw).match(/T\s?\d{1,2}|P|K|C\d{2}/i);
    if (match) return match[0].replace(/\s/g, "").toUpperCase();
    return "T16";
  })();

  // Season chip (e.g. "Phần 1"). Derived from the name/origin if present.
  const seasonLabel = (() => {
    const src = `${m.name} ${m.origin_name ?? ""}`;
    const vi = src.match(/Phần\s*(\d+)/i);
    if (vi) return `Phần ${vi[1]}`;
    const en = src.match(/Season\s*(\d+)|\bS(\d+)\b/i);
    if (en) return `Phần ${en[1] ?? en[2]}`;
    return m.type === "series" || m.type === "tvshows" ? "Phần 1" : "";
  })();

  const rating = m.tmdb?.vote_average
    ? parseFloat(String(m.tmdb.vote_average))
    : null;

  const langLabel = m.lang
    ? m.lang.toLowerCase().includes("lồng")
      ? "LT"
      : m.lang.toLowerCase().includes("thuyết")
        ? "TM"
        : "PĐ"
    : "";
  const epNum = m.episode_current
    ? (m.episode_current.match(/\d+/) ?? [""])[0]
    : "";

  const computePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Free-floating popup width (not tied to the narrow poster width) so it
    // can grow like the regular movie-card popups.
    const width = Math.min(400, window.innerWidth - 16);
    let left = rect.left + rect.width / 2 - width / 2;
    const margin = 8;
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
    // Anchor the popup near the top of the poster (shifted up) instead of the
    // vertical center, so it rises above the card instead of covering it.
    const top = rect.top + rect.height * 0.28;
    setPos({ left, top, width });
  }, []);

  const onHoverStart = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      computePos();
      setIsHovered(true);
    }, 220);
  }, [computePos]);

  const onHoverEnd = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    setIsHovered(false);
  }, []);

  useLayoutEffect(() => {
    if (!isHovered) return;
    const handler = () => computePos();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [isHovered, computePos]);

  const isBilingual = !!m.lang && /lồng|thuyết|song|vietsub \+/i.test(m.lang);

  return (
    <div
      ref={wrapRef}
      className="group relative w-[168px] flex-shrink-0 sm:w-[215px]"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Poster — tall (2:3), upright, rounded; subtle diagonal top edge */}
      <Link
        to={detailUrl}
        aria-label={`${rank}. ${m.name}`}
        className={`relative block ${isHovered ? "z-30" : "z-10"}`}
      >
        <div
          className={`relative aspect-[2/3] w-full overflow-hidden rounded-[16px] bg-gray-900 transition-all duration-300 ease-out ${
            isHovered
              ? "-translate-y-1.5 scale-[1.03] shadow-2xl shadow-black/60"
              : "shadow-md"
          }`}
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          <img
            src={getMoviePoster(m.poster_url, m.thumb_url)}
            alt={m.name}
            loading="lazy"
            width={240}
            height={360}
            className="h-full w-full object-cover"
            onError={onImgError}
          />

          {/* Top-left blue "Song ngữ" badge */}
          {isBilingual && (
            <span className="absolute left-1.5 top-5 rounded-md bg-[#0d8bd9] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
              Song ngữ
            </span>
          )}

          {/* Top-left blue rating badge (when no bilingual badge) */}
          {!isBilingual && showRating && rating !== null && rating > 0 && (
            <span className="absolute left-1.5 top-5 flex items-center gap-0.5 rounded-md bg-[#01B4E4] px-1.5 py-0.5 text-[10px] font-bold text-white">
              <FaStar className="h-2.5 w-2.5" />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Green lang/episode pill — bottom-left */}
          {(langLabel || epNum) && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-[#2ca35d] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {langLabel}
              {epNum ? `.${epNum}` : ""}
            </span>
          )}

          {/* Hover: light-blue ring + dark overlay on the poster image */}
          <div
            className={`pointer-events-none absolute inset-0 rounded-[16px] transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              boxShadow: "inset 0 0 0 2px #5edfff",
              background:
                "linear-gradient(180deg, rgba(94,223,255,0.10) 0%, rgba(15,17,26,0.35) 100%)",
            }}
          />
        </div>
      </Link>

      {/* Info block BELOW poster: rank number + title/alias/tag chips */}
      <div className="mt-1.5 flex items-start gap-1.5">
        <span
          aria-hidden
          className="select-none text-[2rem] font-black italic leading-none text-[#ffe9b3] sm:text-[2.4rem]"
          style={{ textShadow: "0 2px 5px rgba(0,0,0,0.45)" }}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <Link to={detailUrl} className="block">
            <p className="truncate text-[13px] font-semibold text-white transition-colors group-hover:text-[#ffd166]">
              {m.name}
            </p>
            {m.origin_name && (
              <p className="truncate text-[11px] text-white/50">
                {m.origin_name}
              </p>
            )}
          </Link>
          <div className="mt-0.5 truncate text-[11px] text-white/60">
            {[ageLabel, seasonLabel, m.episode_current || (m.year > 0 ? m.year : null)]
              .filter(Boolean)
              .join(" • ")}
          </div>
        </div>
      </div>

      {/* Hover popup — portal + fixed so nothing clips it (never cut off) */}
      {createPortal(
        <AnimatePresence>
          {isHovered && pos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onMouseEnter={onHoverStart}
              onMouseLeave={onHoverEnd}
              onClick={() => navigate(detailUrl)}
              style={{
                position: "fixed",
                left: pos.left,
                top: pos.top,
                width: pos.width,
                transform: "translateY(-50%)",
              }}
              className="z-[100] hidden cursor-pointer overflow-hidden rounded-[18px] bg-[#2B2F42] shadow-[0_24px_60px_rgba(0,0,0,0.75)] md:block"
            >
              {/* Landscape banner */}
              <div className="relative aspect-video w-full bg-black">
                <img
                  src={getMoviePoster(m.thumb_url, m.poster_url)}
                  alt={m.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={onImgError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2F42] via-[#2B2F42]/20 to-transparent" />
                {!detailData && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-[#ffd166]"
                    />
                  </span>
                )}
              </div>

              <div className="p-4">
                <p className="truncate text-base font-bold text-white">{m.name}</p>
                {m.origin_name && (
                  <p className="truncate text-sm font-medium text-[#ffd166]">
                    {m.origin_name}
                  </p>
                )}

                {/* Buttons */}
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={watchUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#ffd166] text-sm font-bold text-[#0f1115] transition-colors hover:bg-[#ffe099]"
                  >
                    <FaPlay className="h-3 w-3" />
                    {t("movie.watchNow")}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(m);
                    }}
                    aria-label={t("nav.favorites")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <FaHeart
                      className={`h-4 w-4 ${isFavorite(m.slug) ? "text-[#ffd166]" : ""}`}
                    />
                  </button>
                  <Link
                    to={detailUrl}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("movie.moreInfo")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <FaInfoCircle className="h-4 w-4" />
                  </Link>
                </div>

                {/* Metadata badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/85">
                  {rating !== null && rating > 0 && (
                    <span className="flex items-center overflow-hidden rounded border border-[#f5c518]/60">
                      <span className="bg-[#f5c518] px-1.5 py-0.5 text-black">IMDb</span>
                      <span className="bg-[#f5c518]/10 px-1.5 py-0.5">
                        {rating.toFixed(1)}
                      </span>
                    </span>
                  )}
                  {m.year > 0 && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {m.year}
                    </span>
                  )}
                  {m.quality && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {m.quality.toUpperCase()}
                    </span>
                  )}
                  {m.episode_current && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {m.episode_current}
                    </span>
                  )}
                  {m.lang && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {m.lang}
                    </span>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <p className="mt-2.5 line-clamp-3 text-[12px] leading-snug text-white/70">
                    {description}
                  </p>
                )}

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {genres.slice(0, 4).map((g) => (
                      <Link
                        key={g.slug ?? g.name}
                        to={`${ROUTES.GENRES}/${g.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border border-white/15 bg-white/5 px-2 py-[2px] text-[11px] text-white/75 transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

/**
 * CôBe Phim / RoPhim "Top 10" ranking row. Tall upright posters with a
 * diagonally-clipped top edge (dovetailing in pairs), a small rank number
 * below-left, movie info beneath, and a large portal-rendered hover popup
 * with description that floats above everything (never clipped).
 */
const TopRankingRow: React.FC<TopRankingRowProps> = ({
  title,
  movies,
  viewAllLink,
  limit = 10,
  showRating = true,
}) => {
  const items = movies.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="no-scrollbar -mx-4 flex items-start gap-2 overflow-x-auto overflow-y-visible px-4 pb-4 pt-4 sm:mx-0 sm:px-0">
        {items.map((m, idx) => (
          <TopRankingCard
            key={m._id ?? m.slug}
            movie={m}
            rank={idx + 1}
            showRating={showRating}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(TopRankingRow);
