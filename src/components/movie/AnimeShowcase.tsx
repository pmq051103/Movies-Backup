import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaPlay, FaHeart, FaExclamation } from "react-icons/fa";
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
 * "Kho Tàng Anime Mới Nhất" style showcase.
 *
 * Desktop (`sm` and up): one big spotlight panel with the poster as a
 * full-bleed backdrop and title/chips/description overlaid directly on
 * top of it, plus a thumbnail filmstrip straddling the bottom edge.
 *
 * Mobile (below `sm`): a completely different arrangement — one single
 * rounded block (NOT two boxes with a seam between them): the artwork on
 * top (object-cover, natural crop, not letterboxed) fades via gradient
 * into a solid light-gray panel directly below it, and ALL the text
 * (title/chips/genres/description) lives in that panel. No action
 * buttons on mobile — the title is already a tap-through link to the
 * detail page. Nav is dots only + swipe/auto-advance/thumbnail-tap on
 * desktop — no arrow buttons anywhere.
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

  // Shared chips row — same badges + same colors on mobile and desktop:
  //  - IMDb: gold border, "IMDb" label in gold, rating number in white.
  //  - Quality (4K/FHD/…): solid gold pill, dark text.
  //  - Age rating (T16): solid white pill, black text.
  //  - Year / season / episode count: no fill, a clearly-visible solid
  //    white border + white text (not a faint white/30 tint).
  const chips = (
    <>
      {rating !== null && rating > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md border border-[#ffd166] px-2.5 py-1">
          <span className="font-extrabold text-[#ffd166]">IMDb</span>
          <span className="font-bold text-white">{rating.toFixed(1)}</span>
        </span>
      )}
      {active.quality && (
        <span className="rounded-md bg-[#ffd166] px-2.5 py-1 font-extrabold text-[#1a1205]">
          {active.quality}
        </span>
      )}
      <span className="rounded-md bg-white px-2.5 py-1 font-extrabold text-[#111]">
        {ageLabel}
      </span>
      {active.year > 0 && (
        <span className="rounded-md border-2 border-white px-2.5 py-1 font-bold text-white">
          {active.year}
        </span>
      )}
      <span className="rounded-md border-2 border-white px-2.5 py-1 font-bold text-white">
        {seasonLabel}
      </span>
      {active.episode_current && (
        <span className="rounded-md border-2 border-white px-2.5 py-1 font-bold text-white">
          {active.episode_current}
        </span>
      )}
    </>
  );

  const genreChips = genres.length > 0 && (
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
  );

  const actions = (
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
  );

  return (
    <section className="w-full pb-12 sm:pb-14">
      <SectionTitle title={title} viewAllLink={viewAllLink} />

      {/* ================= MOBILE (below sm) ================= */}
      <div className="sm:hidden">
        {/* One single rounded block — the image and the info panel below
            it are NOT two separate boxes with a seam between them, they
            share the panel's light-gray background and the image just
            fades into it via a gradient, so it reads as one continuous
            card. */}
        <div className="overflow-hidden rounded-2xl bg-[#3a3b46]">
          <div className="relative aspect-[3/2] w-full">
            <img
              key={active.slug}
              src={getMoviePoster(active.thumb_url, active.poster_url)}
              alt={active.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={onImgError}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#3a3b46] to-transparent" />
          </div>

          {/* Info panel — light gray (#3a3b46, same as the image's fade
              target above), everything lives BELOW the image here, not
              overlaid on top of it like on desktop. No action buttons on
              mobile (Xem ngay/Yêu thích/Thông tin) — the title is already
              a tap-through link to the detail page. */}
          <div className="px-4 pb-4 pt-1">
            <Link to={detailUrl}>
              <h3 className="text-lg font-bold text-white transition-colors hover:text-[#ffd166]">
                {active.name}
              </h3>
            </Link>
            {active.origin_name && (
              <p className="mt-0.5 text-sm font-medium text-[#ffd166]">{active.origin_name}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white">
              {chips}
            </div>

            {genreChips}

            {description && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/80">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Pagination dots — sits below the whole card (never overlapping
            it), bigger than before so they're easier to tap. */}
        {items.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
                    isActive ? "h-2.5 w-2.5 bg-[#ffd166]" : "h-2 w-2 bg-white/40"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ================= DESKTOP (sm and up) ================= */}
      <div className="relative hidden w-full sm:block">
        {/* Big spotlight panel */}
        <div className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-white/5 bg-[#12131a] lg:h-[620px] xl:h-[680px] 2xl:h-[740px]">
          <img
            key={active.slug}
            src={getMoviePoster(active.thumb_url, active.poster_url)}
            alt={active.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={onImgError}
          />
          {/* Left-to-right + bottom gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#12131a] via-[#12131a]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12131a] via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-10 lg:max-w-2xl xl:max-w-3xl">
              <Link to={detailUrl}>
                <h3 className="text-3xl font-bold text-white transition-colors hover:text-[#ffd166] xl:text-4xl">
                  {active.name}
                </h3>
              </Link>
              {active.origin_name && (
                <p className="mt-1 text-base font-medium text-[#ffd166]">{active.origin_name}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
                {chips}
              </div>

              {genreChips}

              {description && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 line-clamp-3">
                  {description}
                </p>
              )}

              {actions}
            </div>
          </div>
        </div>

        {/* Thumbnail filmstrip — centered, straddling the boundary
            between the spotlight panel and the page background. Extra
            vertical padding on the scroll track keeps the active item's
            ring from being clipped top/bottom (an `overflow-x: auto`
            container without `overflow-y` set also clips the y-axis per
            spec, which was cutting the ring off flush with the edges). */}
        {items.length > 1 && (
          <div className="no-scrollbar absolute left-1/2 top-full z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 overflow-x-auto px-1 py-1.5">
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
      </div>
    </section>
  );
};

export default memo(AnimeShowcase);
