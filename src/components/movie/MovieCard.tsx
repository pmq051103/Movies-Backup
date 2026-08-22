import { useState, memo, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FaPlay,
  FaStar,
  FaHeart,
  FaInfoCircle,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES, QUERY_KEYS } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import { getMovieDetailFromSource, getMovieDetailDual, type MovieSource } from '@/api/dualSource';
import { useFavoriteStore } from '@/store';
import type { MovieListItem } from '@/types';

export interface MovieCardProps {
  movie: MovieListItem;
  index?: number;
}

/** Strip HTML tags from the API `content` for a clean description. */
function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  // Subscribe to a value derived from `favorites`, not the `isFavorite`
  // method — a selected method reference is stable across renders, so the
  // component never re-rendered on toggle and the heart appeared "stuck".
  const isFav = useFavoriteStore((s) => s.favorites.some((f) => f.slug === movie.slug));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const posterSrc = getMoviePoster(movie.poster_url, movie.thumb_url);
  const backdropSrc = getMoviePoster(movie.thumb_url, movie.poster_url);
  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;

  const source: MovieSource =
    ((movie as MovieListItem & { _source?: MovieSource })._source) ?? 'phimapi';
  const detailUrl =
    source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;
  const watchUrl = `${ROUTES.WATCH}/${movie.slug}${source !== 'phimapi' ? `?src=${source}` : ''}`;

  // Fetch the full detail (description, genres, countries) for the hover
  // popup, cached by react-query so repeat hovers are instant.
  //
  // IMPORTANT: gated behind `enabled: isHovered`. Fetching eagerly for
  // every card fired one (and, with the fallback below, up to FOUR)
  // requests per card the moment a row rendered — a request storm that
  // starved the homepage's list queries, so their sections came back
  // empty and hid themselves. The base card badges below already fall
  // back to the list-item fields, so nothing needs the detail up front.
  //
  // Fallback: a single source can map this slug to a missing movie or
  // return an empty `content` — that's why some cards showed a
  // description on hover and some didn't. When the preferred source has
  // no content, fall back to the merged multi-source detail so the
  // description/genres are filled in from whichever source has them.
  const { data: detailData } = useQuery({
    queryKey: [QUERY_KEYS.MOVIE_DETAIL, 'card', movie.slug, source],
    queryFn: async () => {
      const primary = await getMovieDetailFromSource(movie.slug, source);
      if (primary?.movie?.content) return primary;
      const merged = await getMovieDetailDual(movie.slug, source).catch(() => null);
      if (merged?.movie?.content) return merged;
      return primary ?? merged;
    },
    enabled: isHovered,
    staleTime: 10 * 60 * 1000,
  });

  const detail = detailData?.movie;

  // Format episode badge: "Hoàn Tất (24/24)" → "24/24", "Tập 12" + total "32" → "12/32", "Full" → "Full"
  const episodeBadge = (() => {
    const ep = detail?.episode_current ?? movie.episode_current;
    if (!ep) return '';
    const match = ep.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    const tapMatch = ep.match(/[Tt]ập\s*(\d+)/);
    if (tapMatch) {
      const current = tapMatch[1];
      const total = detail?.episode_total ?? (movie as any).episode_total;
      if (total && total !== '?' && total !== '0') return `${current}/${total}`;
      return `Tập ${current}`;
    }
    if (ep === 'Full') return 'Full';
    return ep;
  })();

  // Episode number used inside the lang pin(s) — e.g. "TM.43" = thuyết minh 43 tập.
  const epNum = (() => {
    const ep = detail?.episode_current ?? movie.episode_current;
    if (!ep) return '';
    const m = String(ep).match(/\d+/);
    return m ? m[0] : '';
  })();

  // Language pins (PĐ / TM / LT), one badge per audio track with the episode
  // count, matching the Top Phim cards.
  const langPins = (() => {
    const raw = ((detail?.lang ?? movie.lang) || '').toLowerCase();
    const pins: { label: string; className: string }[] = [];
    if (/lồng|long tieng|\blt\b/.test(raw)) pins.push({ label: 'LT', className: 'bg-[#1667cf]' });
    if (/thuyết|thuyet|\btm\b/.test(raw)) pins.push({ label: 'TM', className: 'bg-[#2ca35d]' });
    if (/vietsub|phụ đề|phu de|\bpđ\b|\bpd\b/.test(raw))
      pins.push({ label: 'PĐ', className: 'bg-[#5e6070]' });
    if (pins.length === 0 && raw) pins.push({ label: 'PĐ', className: 'bg-[#5e6070]' });
    return pins;
  })();

  const quality = detail?.quality || movie.quality;
  const time = detail?.time || '';
  const description = detail?.content ? stripHtml(detail.content) : '';
  const genres = detail?.category ?? [];

  // Whether this movie has a real, playable episode (not trailer-only /
  // not-yet-released). Used to hide the "Xem ngay" button in the hover
  // popup. Only decidable once the detail (with episodes) has loaded —
  // default to showing the button until then so we don't flicker it off
  // for movies that DO have episodes.
  const hasEpisodes = (() => {
    if (!detailData) return true;
    if (detail?.status === 'trailer') return false;
    return (
      detailData.episodes?.some((ep) =>
        ep.server_data?.some(
          (sd) => sd.link_embed?.trim() || sd.link_m3u8?.trim(),
        ),
      ) ?? false
    );
  })();

  // Compute the fixed popup position from the card's on-screen rect. The
  // popup is wider than the card and centered on it horizontally, anchored
  // just above the card, clamped to the viewport so it never overflows the
  // edges. Rendered in a portal so no scroll container can clip it (fixes
  // the "cut off at the top" issue).
  const computePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width * 2, 380), Math.min(440, window.innerWidth - 16));
    let left = rect.left + rect.width / 2 - width / 2;
    const margin = 8;
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);

    // Anchor the popup so its top edge sits just above the top of the
    // hovered card (instead of being centered on it). Clamped to keep the
    // popup fully on-screen (below the fixed header, above the viewport
    // bottom) for rows near the edges.
    const estimatedHeight = width * (9 / 16) + 260;
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
    // Small grace period so moving the cursor from the card up into the
    // floating popup doesn't close it before it arrives.
    hoverTimer.current = setTimeout(() => setIsHovered(false), 180);
  }, []);

  // Keep the popup glued to the card while scrolling/resizing.
  useLayoutEffect(() => {
    if (!isHovered) return;
    const handler = () => computePos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isHovered, computePos]);

  return (
    <div
      ref={wrapRef}
      className="group relative"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* ── Base card: poster (2:3) + title underneath ── */}
      <div className="flex flex-col gap-2.5">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.03] bg-gray-900">
          <Link to={detailUrl} aria-label={movie.name} title={movie.name} className="absolute inset-0 z-[1]">
            <img
              src={posterSrc}
              alt={movie.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={onImgError}
            />
          </Link>

          {/* Gold circle quality badge — top-left */}
          {quality && (
            <span className="absolute left-[.35rem] top-[.35rem] z-[2] flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-[#0f111a] shadow-[0_0_0_2px_rgba(0,0,0,0.3)] [background:linear-gradient(220deg,#FFD166,#FFF)]">
              {quality === '4K' ? '4K' : quality.toUpperCase().slice(0, 2)}
            </span>
          )}

          {/* Rating — top-right (IMDb gold) */}
          {rating !== null && rating > 0 && (
            <span className="absolute right-[.3rem] top-[.3rem] z-[2] flex items-center gap-0.5 rounded-[.28rem] bg-[#fecf59] px-1 py-[1px] text-[10px] font-bold text-[#0f111a]">
              <FaStar className="h-2 w-2" />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Episode badge — bottom-left */}
          {episodeBadge && (
            <span className="absolute bottom-[.3rem] left-[.3rem] z-[2] rounded-[.28rem] bg-black/70 px-1.5 py-[2px] text-[10px] font-bold text-white backdrop-blur-sm">
              {episodeBadge}
            </span>
          )}

          {/* LT/TM/PĐ pin(s) — bottom center, each with episode count (TM.43) */}
          {langPins.length > 0 && (
            <div className="absolute bottom-0 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1">
              {langPins.map((p) => (
                <span
                  key={p.label}
                  className={`rounded-t-[.3rem] px-1.5 py-[2px] text-[10px] font-bold text-white shadow-[0_0_5px_2px_rgba(0,0,0,0.1)] ${p.className}`}
                >
                  {p.label}
                  {epNum ? `.${epNum}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Title below image — tophim style: left-aligned, no card bg */}
        <div className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-normal leading-snug text-white transition-colors group-hover:text-[#ffd166]">
            <Link to={detailUrl}>{movie.name}</Link>
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
            {[movie.origin_name && movie.origin_name !== movie.name ? movie.origin_name : null, movie.year > 0 ? movie.year : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      {/* ── Hover preview popup (desktop only) — Netflix / CôBe Phim style.
          A large landscape card rendered in a PORTAL with fixed positioning
          so it floats above everything and is never clipped by a scroll
          container. Applied to every MovieCard. ── */}
      {createPortal(
        <AnimatePresence>
          {isHovered && pos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onMouseEnter={onHoverStart}
              onMouseLeave={onHoverEnd}
              onClick={() => navigate(detailUrl)}
              style={{
                position: 'fixed',
                left: pos.left,
                top: pos.top,
                width: pos.width,
              }}
              className="z-[100] hidden cursor-pointer overflow-hidden rounded-[18px] bg-[#2B2F42] shadow-[0_24px_60px_rgba(0,0,0,0.75)] md:block"
            >
              {/* Landscape backdrop banner */}
              <div className="relative aspect-video w-full bg-black">
                <img
                  src={backdropSrc}
                  alt={movie.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={onImgError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2F42] via-[#2B2F42]/20 to-transparent" />

                {!detailData && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-[#ffd166]"
                    />
                  </span>
                )}
              </div>

              <div className="p-4">
                {/* Title */}
                <p className="truncate text-base font-bold text-white">{movie.name}</p>
                {movie.origin_name && movie.origin_name !== movie.name && (
                  <p className="truncate text-sm font-medium text-[#ffd166]">
                    {movie.origin_name}
                  </p>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-2">
                  {hasEpisodes && (
                    <Link
                      to={watchUrl}
                      onClick={(e) => e.stopPropagation()}
                      title={t('movie.watchNow')}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold text-[#0f1115] transition-transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(39deg, #fecf59, #fff1cc)' }}
                    >
                      <FaPlay className="h-3 w-3" />
                      {t('movie.watchNow')}
                    </Link>
                  )}

                  <button
                    type="button"
                    title={t('movie.addFavorite')}
                    aria-label={t('movie.addFavorite')}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-90"
                  >
                    <FaHeart
                      className={`h-4 w-4 ${isFav ? 'text-[#ffd166]' : ''}`}
                    />
                  </button>

                  <Link
                    to={detailUrl}
                    onClick={(e) => e.stopPropagation()}
                    title={t('movie.moreInfo')}
                    aria-label={t('movie.moreInfo')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <FaInfoCircle className="h-4 w-4" />
                  </Link>
                </div>

                {/* Meta row */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/85">
                  {rating !== null && rating > 0 && (
                    <span className="flex items-center overflow-hidden rounded border border-[#f5c518]/60">
                      <span className="bg-[#f5c518] px-1.5 py-0.5 text-black">IMDb</span>
                      <span className="bg-[#f5c518]/10 px-1.5 py-0.5">
                        {rating.toFixed(1)}
                      </span>
                    </span>
                  )}
                  {movie.year > 0 && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {movie.year}
                    </span>
                  )}
                  {quality && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {quality.toUpperCase()}
                    </span>
                  )}
                  {episodeBadge && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {episodeBadge}
                    </span>
                  )}
                  {time && (
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5">
                      {time}
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

export default memo(MovieCard);
