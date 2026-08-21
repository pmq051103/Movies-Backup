import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaPlay, FaHeart, FaExclamation, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ROUTES, QUERY_KEYS } from "@/constants";
import { getMoviePoster, onImgError } from "@/utils";
import { getMovieDetailFromSource, type MovieSource } from "@/api/dualSource";
import { useFavoriteStore } from "@/store";
import { SectionTitle } from "@/components/common";
import type { MovieListItem } from "@/types";

interface AnimeShowcaseProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  limit?: number;
}

/** Strip HTML tags from the API `content` for a clean description. */
function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * "Kho Tàng Anime Mới Nhất" style showcase: one big spotlight panel (title,
 * rating/age/year/season chips, genre tags, description, play/favorite/info
 * actions) with a horizontal strip of small thumbnails underneath — clicking
 * a thumbnail swaps the whole panel instead of navigating to a new row.
 */
const AnimeShowcase: React.FC<AnimeShowcaseProps> = ({
  title,
  movies,
  viewAllLink,
  limit = 13,
}) => {
  const { t } = useTranslation();
  const items = movies.slice(0, limit);
  const [activeIdx, setActiveIdx] = useState(0);
  const goToMovie = useCallback(
    (dir: "prev" | "next") => {
      setActiveIdx((prev) => {
        if (items.length <= 1) return prev;
        const step = dir === "next" ? 1 : -1;
        return (prev + step + items.length) % items.length;
      });
    },
    [items.length],
  );
  // `active` may be undefined (empty `movies`) — every hook below must still
  // be called unconditionally (Rules of Hooks), so everything is guarded
  // instead of bailing out early before these run.
  const active: MovieListItem | undefined =
    items.length > 0 ? items[Math.min(activeIdx, items.length - 1)] : undefined;

  // Auto-advance the spotlight every few seconds, like the reference
  // carousel — paused implicitly whenever there's nothing to rotate
  // through, and reset whenever the item count changes.
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => goToMovie("next"), 6000);
    return () => clearInterval(id);
  }, [items.length, goToMovie]);

  const isFav = useFavoriteStore((s) =>
    active ? s.favorites.some((f) => f.slug === active.slug) : false,
  );
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const source: MovieSource =
    ((active as (MovieListItem & { _source?: MovieSource }) | undefined)?._source) ?? "phimapi";
  const detailUrl = active
    ? source !== "phimapi"
      ? `${ROUTES.MOVIE_DETAIL}/${active.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${active.slug}`
    : "";
  const watchUrl = active
    ? `${ROUTES.WATCH}/${active.slug}${source !== "phimapi" ? `?src=${source}` : ""}`
    : "";

  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, "anime-showcase", active?.slug, source],
    queryFn: () => getMovieDetailFromSource(active!.slug, source),
    enabled: !!active,
    staleTime: 10 * 60 * 1000,
  });
  const detail = detailData?.movie;
  const description = detail?.content ? stripHtml(detail.content) : "";
  const genres = detail?.category ?? [];

  const rating = active?.tmdb?.vote_average
    ? parseFloat(String(active.tmdb.vote_average))
    : null;

  const ageLabel = (() => {
    const raw = (detail as (typeof detail & { rating?: string }) | undefined)?.rating ?? "";
    const match = String(raw).match(/T\s?\d{1,2}|P|K|C\d{2}/i);
    return match ? match[0].replace(/\s/g, "").toUpperCase() : "T16";
  })();

  const seasonLabel = (() => {
    if (!active) return "";
    const src = `${active.name} ${active.origin_name ?? ""}`;
    const vi = src.match(/Phần\s*(\d+)/i);
    if (vi) return `Phần ${vi[1]}`;
    return "Phần 1";
  })();

  // Hooks are all called above unconditionally — safe to bail out now.
  if (!active) return null;

  return (
    <section className="w-full pb-12 sm:pb-14">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      <div className="relative w-full">
        {/* Big spotlight panel */}
        <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-white/5 bg-[#12131a] sm:h-[560px] lg:h-[620px] xl:h-[680px] 2xl:h-[740px]">
          <img
            key={active.slug}
            src={getMoviePoster(active.thumb_url, active.poster_url)}
            alt={active.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={onImgError}
          />
          {/* Left-to-right + bottom gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#12131a] via-[#12131a]/70 to-transparent sm:via-[#12131a]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12131a] via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 sm:px-10 lg:max-w-2xl xl:max-w-3xl">
              <Link to={detailUrl}>
                <h3 className="text-2xl font-bold text-white transition-colors hover:text-[#ffd166] sm:text-3xl xl:text-4xl">
                  {active.name}
                </h3>
              </Link>
              {active.origin_name && (
                <p className="mt-1 text-sm font-medium text-[#ffd166] sm:text-base">
                  {active.origin_name}
                </p>
              )}

              {/* Chips row */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
                {rating !== null && rating > 0 && (
                  <span className="rounded-md border border-white/30 px-2.5 py-1">
                    IMDb {rating.toFixed(1)}
                  </span>
                )}
                <span className="rounded-md border border-white/30 px-2.5 py-1">{ageLabel}</span>
                {active.year > 0 && (
                  <span className="rounded-md border border-white/30 px-2.5 py-1">
                    {active.year}
                  </span>
                )}
                <span className="rounded-md border border-white/30 px-2.5 py-1">
                  {seasonLabel}
                </span>
                {active.episode_current && (
                  <span className="rounded-md border border-white/30 px-2.5 py-1">
                    {active.episode_current}
                  </span>
                )}
              </div>

              {/* Genre tags */}
              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {genres.slice(0, 6).map((g) => (
                    <Link
                      key={g.slug ?? g.name}
                      to={`${ROUTES.GENRES}/${g.slug}`}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70 transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              {description && (
                <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-white/80 line-clamp-3 sm:block">
                  {description}
                </p>
              )}

              {/* Actions */}
              <div className="mt-5 flex items-center gap-3">
                <Link
                  to={watchUrl}
                  title={t("movie.watchNow")}
                  aria-label={t("movie.watchNow")}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#0f1115] shadow-[0_0_15px_rgba(254,207,89,0.5)] transition-transform hover:scale-105 sm:h-14 sm:w-14"
                  style={{ background: "linear-gradient(39deg, #fecf59, #fff1cc)" }}
                >
                  <FaPlay className="h-5 w-5 translate-x-0.5 sm:h-6 sm:w-6" />
                </Link>
                <button
                  type="button"
                  title={t("movie.addFavorite")}
                  aria-label={t("movie.addFavorite")}
                  onClick={() => toggleFavorite(active)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-[#ffd166] hover:text-[#ffd166] active:scale-90 sm:h-12 sm:w-12"
                >
                  <FaHeart className={`h-4 w-4 ${isFav ? "text-[#ffd166]" : ""}`} />
                </button>
                <Link
                  to={detailUrl}
                  title={t("movie.moreInfo")}
                  aria-label={t("movie.moreInfo")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-[#ffd166] hover:text-[#ffd166] sm:h-12 sm:w-12"
                >
                  <FaExclamation className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Prev/next arrows — desktop only. Docked to the bottom-right
            corner instead of floating mid-panel, so they never sit on top
            of the title/description text on the left. Mobile relies on
            the dot pagination + auto-advance below instead. */}
        {items.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goToMovie("prev")}
              aria-label={t("common.scrollLeft")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToMovie("next")}
              aria-label={t("common.scrollRight")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-[#ffd166] hover:text-[#ffd166]"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Thumbnail filmstrip (desktop) — centered, straddling the
            boundary between the spotlight panel and the page background.
            Mobile swaps this for a row of pagination dots below. */}
        {items.length > 1 && (
          <div className="no-scrollbar absolute left-1/2 top-full z-10 hidden max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 overflow-x-auto px-1 sm:flex">
            {items.map((m, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={m._id ?? m.slug}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={m.name}
                  aria-pressed={isActive}
                  className={`relative aspect-[2/3] w-[70px] shrink-0 overflow-hidden rounded-md shadow-lg shadow-black/40 transition-all duration-200 lg:w-[84px] xl:w-[96px] ${
                    isActive
                      ? "ring-2 ring-[#ffd166] ring-offset-2 ring-offset-[#0e0f16]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getMoviePoster(m.poster_url, m.thumb_url)}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={onImgError}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination dots (mobile) — same active-index state as the
            thumbnail strip, just a lighter-weight indicator that fits a
            narrow screen instead of a row of tiny posters. */}
        {items.length > 1 && (
          <div className="absolute left-1/2 top-full z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-wrap items-center justify-center gap-1.5 sm:hidden">
            {items.map((m, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={m._id ?? m.slug}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={m.name}
                  aria-pressed={isActive}
                  className={`shrink-0 rounded-full transition-all duration-200 ${
                    isActive ? "h-2 w-2 bg-[#ffd166]" : "h-1.5 w-1.5 bg-white/40"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(AnimeShowcase);