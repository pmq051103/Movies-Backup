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

// Diagonal dovetail slope as a fraction of the card height (matches the old
// polygon's "11%" edge drop).
const SLOPE = 0.11;

/**
 * Build a rounded-corner "dovetail" clip path (an SVG path, used with
 * `clip-path: path(...)`) for a WxH box whose top edge is a diagonal
 * instead of a straight line. `leanRight` slopes the top edge down to the
 * right (like `polygon(0 0, 100% 11%, 100% 100%, 0 100%)`); otherwise it
 * slopes down to the left. All four corners — including the two corners
 * that meet the diagonal — get a real rounded radius, and because the
 * exact same path is reused for the hover ring, the gold border traces
 * the whole shape (diagonal included) instead of stopping at a plain box.
 */
function dovetailPath(width: number, height: number, radius: number, leanRight: boolean): string {
  const s = height * SLOPE;
  const r = Math.max(0, Math.min(radius, height / 3, width / 3));

  // Corner points of the un-rounded shape.
  const top1 = leanRight ? { x: 0, y: 0 } : { x: 0, y: s };
  const top2 = leanRight ? { x: width, y: s } : { x: width, y: 0 };
  const bottomRight = { x: width, y: height };
  const bottomLeft = { x: 0, y: height };

  // Unit vector along the diagonal top edge.
  const dx = top2.x - top1.x;
  const dy = top2.y - top1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Point just before top1 along the left vertical edge (coming up from
  // the bottom-left corner), and just after top1 along the diagonal.
  const beforeTop1 = { x: 0, y: top1.y + r };
  const afterTop1 = { x: top1.x + ux * r, y: top1.y + uy * r };

  // Point just before top2 along the diagonal, and just after along the
  // right vertical edge.
  const beforeTop2 = { x: top2.x - ux * r, y: top2.y - uy * r };
  const afterTop2 = { x: top2.x, y: top2.y + r };

  const beforeBR = { x: width, y: height - r };
  const afterBR = { x: width - r, y: height };

  const beforeBL = { x: r, y: height };
  const afterBL = { x: 0, y: height - r };

  return [
    `M ${beforeTop1.x} ${beforeTop1.y}`,
    `Q ${top1.x} ${top1.y} ${afterTop1.x} ${afterTop1.y}`,
    `L ${beforeTop2.x} ${beforeTop2.y}`,
    `Q ${top2.x} ${top2.y} ${afterTop2.x} ${afterTop2.y}`,
    `L ${beforeBR.x} ${beforeBR.y}`,
    `Q ${bottomRight.x} ${bottomRight.y} ${afterBR.x} ${afterBR.y}`,
    `L ${beforeBL.x} ${beforeBL.y}`,
    `Q ${bottomLeft.x} ${bottomLeft.y} ${afterBL.x} ${afterBL.y}`,
    "Z",
  ].join(" ");
}

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
  // Subscribe to a derived value, not the `isFavorite` method itself — a
  // selected method reference is stable across renders, so the component
  // never re-rendered on toggle and the heart button looked broken.
  const isFav = useFavoriteStore((s) => s.favorites.some((f) => f.slug === m.slug));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const [isHovered, setIsHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [posterSize, setPosterSize] = useState<{ w: number; h: number } | null>(null);

  const leanRight = rank % 2 === 1; // Top 1,3,5… lean toward the right

  // Measure the poster box so the diagonal clip path (and the hover ring
  // that traces it) is computed in real pixels and stays correct at any
  // width/breakpoint.
  useLayoutEffect(() => {
    const el = posterRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setPosterSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clipPath = posterSize
    ? dovetailPath(posterSize.w, posterSize.h, 16, leanRight)
    : undefined;

  const source: MovieSource =
    ((m as MovieListItem & { _source?: MovieSource })._source) ?? "phimapi";
  const detailUrl =
    source !== "phimapi"
      ? `${ROUTES.MOVIE_DETAIL}/${m.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${m.slug}`;
  const watchUrl = `${ROUTES.WATCH}/${m.slug}${source !== "phimapi" ? `?src=${source}` : ""}`;

  // Fetched eagerly (not gated by hover) — the age/season/country chips sit
  // in the always-visible info block under the poster, not just the hover
  // popup, so they need to be ready before the user ever hovers. Limited to
  // 10 items per row and cached for 10 minutes, so this stays cheap.
  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, "toprank", m.slug, source],
    queryFn: () => getMovieDetailFromSource(m.slug, source),
    staleTime: 10 * 60 * 1000,
  });
  const detail = detailData?.movie;
  const description = detail?.content ? stripHtml(detail.content) : "";
  const genres = detail?.category ?? [];
  const countryName = detail?.country?.[0]?.name ?? "";

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

  const epNum = m.episode_current
    ? (m.episode_current.match(/\d+/) ?? [""])[0]
    : "";

  // Language/episode pin(s) — CôBe Phim shows one or two colored badges
  // (PĐ = Vietsub, TM = Thuyết minh, LT = Lồng tiếng) with the episode
  // count. The API only exposes a single `lang` string + one episode
  // count, so when it mentions several audio tracks we render one badge
  // per track using that same count as the best available approximation.
  const langPins = (() => {
    const raw = (m.lang || "").toLowerCase();
    const pins: { label: string; className: string }[] = [];
    if (/lồng|long tieng|\blt\b/.test(raw)) pins.push({ label: "LT", className: "bg-[#1667cf]" });
    if (/thuyết|thuyet|\btm\b/.test(raw)) pins.push({ label: "TM", className: "bg-[#2ca35d]" });
    if (/vietsub|phụ đề|phu de|\bpđ\b|\bpd\b/.test(raw))
      pins.push({ label: "PĐ", className: "bg-[#5e6070]" });
    if (pins.length === 0 && m.lang) pins.push({ label: "PĐ", className: "bg-[#5e6070]" });
    return pins;
  })();
  const isBilingual = langPins.length > 1;

  const computePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Free-floating popup width (not tied to the narrow poster width) so it
    // can grow like the regular movie-card popups.
    const width = Math.min(420, window.innerWidth - 16);
    let left = rect.left + rect.width / 2 - width / 2;
    const margin = 8;
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);

    // Anchor the popup so its top edge sits just above the top of the
    // hovered card (instead of being centered on it). Clamped to keep the
    // popup fully on-screen (below the fixed header, above the viewport
    // bottom) for rows near the edges.
    const estimatedHeight = width * (9 / 16) + 280;
    const headerClearance = 88;
    const bottomMargin = 16;
    const maxTop = window.innerHeight - bottomMargin - estimatedHeight;
    const rawTop = rect.top - 12;
    const top = Math.min(Math.max(rawTop, headerClearance), Math.max(headerClearance, maxTop));

    setPos({ left, top, width });
  }, []);

  const onHoverStart = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      computePos();
      setIsHovered(true);
    }, 200);
  }, [computePos]);

  const onHoverEnd = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Small grace period so moving from the card into the floating popup
    // doesn't close it before the cursor arrives.
    hoverTimer.current = setTimeout(() => setIsHovered(false), 180);
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

  return (
    <div
      ref={wrapRef}
      className="group relative w-[190px] flex-shrink-0 sm:w-[240px] lg:w-[260px] xl:w-[280px] 2xl:w-[300px]"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Poster — tall (2:3), bigger; diagonal dovetail top edge with real
          rounded corners (SVG clip-path, not a plain polygon). */}
      <Link
        to={detailUrl}
        aria-label={`${rank}. ${m.name}`}
        className={`relative block ${isHovered ? "z-30" : "z-10"}`}
      >
        <div
          ref={posterRef}
          className={`relative aspect-[2/3] w-full overflow-hidden bg-gray-900 transition-shadow duration-300 ease-out ${
            isHovered ? "shadow-2xl shadow-black/60" : "shadow-md"
          }`}
          style={clipPath ? { clipPath: `path('${clipPath}')` } : undefined}
        >
          <img
            src={getMoviePoster(m.poster_url, m.thumb_url)}
            alt={m.name}
            loading="lazy"
            width={280}
            height={420}
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

          {/* Lang/episode pill(s) — bottom-right, one badge per audio
              track (PĐ / TM / LT), like the reference site. */}
          {langPins.length > 0 && (
            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
              {langPins.map((p) => (
                <span
                  key={p.label}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${p.className}`}
                >
                  {p.label}
                  {epNum ? `.${epNum}` : ""}
                </span>
              ))}
            </div>
          )}

          {/* Hover: dark overlay clipped to the dovetail shape. */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              clipPath: clipPath ? `path('${clipPath}')` : undefined,
              background:
                "linear-gradient(180deg, rgba(255,209,102,0.08) 0%, rgba(15,17,26,0.35) 100%)",
            }}
          />
        </div>

        {/* Hover: gold ring that traces the exact clipped shape (diagonal
            cut + rounded corners included). Rendered as an SVG sibling of
            the clipped poster so the stroke follows the diagonal instead of
            a plain box edge. */}
        {posterSize && (
          <svg
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            width={posterSize.w}
            height={posterSize.h}
            viewBox={`0 0 ${posterSize.w} ${posterSize.h}`}
            preserveAspectRatio="none"
          >
            <path
              d={clipPath ?? ""}
              fill="none"
              stroke="#ffd166"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </Link>

      {/* Info block BELOW poster: rank number + title/alias/tag chips */}
      <div className="mt-2 flex items-start gap-2">
        <span
          aria-hidden
          className="select-none text-[2.2rem] font-black italic leading-none text-[#ffe9b3] sm:text-[2.6rem] xl:text-[2.9rem]"
          style={{ textShadow: "0 2px 5px rgba(0,0,0,0.45)" }}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <Link to={detailUrl} className="block">
            <p className="truncate text-[14px] font-semibold text-white transition-colors group-hover:text-[#ffd166]">
              {m.name}
            </p>
            {m.origin_name && (
              <p className="truncate text-[12px] text-white/50">
                {m.origin_name}
              </p>
            )}
          </Link>
          <div className="mt-0.5 truncate text-[11px] text-white/60">
            {[
              ageLabel,
              seasonLabel,
              m.episode_current || (m.year > 0 ? String(m.year) : null),
              countryName,
            ]
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
                      className={`h-4 w-4 ${isFav ? "text-[#ffd166]" : ""}`}
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

      <div className="no-scrollbar -mx-4 flex items-start gap-2 overflow-x-auto overflow-y-visible px-4 pb-4 pt-4 sm:mx-0 sm:gap-3 sm:px-0">
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
