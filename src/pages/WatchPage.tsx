import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaServer,
  FaLanguage,
  FaFilm,
  FaToggleOn,
  FaToggleOff,
  FaPlay,
  FaHeart,
  FaRegHeart,
  FaPlus,
  FaForward,
  FaShareAlt,
  FaUsers,
  FaFlag,
  FaEye,
  FaChevronRight,
  FaUserCircle,
} from 'react-icons/fa';

import { EpisodeList, MovieRow } from '@/components/movie';
import { ShareButtons } from '@/components/common';
import { ROUTES } from '@/constants';
import {
  useMovieDetail,
  useMoviesInGenre,
  useMoviesBySlug,
  useSearchMovies,
  useTmdbExtras,
} from '@/hooks';
import { getTmdbImageUrl } from '@/api/tmdbService';
import { usePlayerStore, useHistoryStore, useFavoriteStore } from '@/store';
import { getMoviePoster, onImgError } from '@/utils';
import { normalizeVi } from '@/utils/searchRank';
import type { Episode, MovieListItem } from '@/types';

/* ------------------------------------------------------------------ */
/* Animation variants                                                  */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/* Helper: resolve server/episode indices from URL params              */
/* ------------------------------------------------------------------ */

function resolveIndices(
  episodes: Episode[],
  svParam: string | null,
  tapParam: string | null,
): { serverIndex: number; episodeIndex: number } {
  let serverIndex = 0;
  let episodeIndex = 0;

  if (svParam) {
    const idx = episodes.findIndex(
      (ep) => ep.server_name === svParam,
    );
    if (idx !== -1) serverIndex = idx;
  }

  if (tapParam && episodes[serverIndex]) {
    const idx = episodes[serverIndex].server_data.findIndex(
      (sd) => sd.slug === tapParam,
    );
    if (idx !== -1) episodeIndex = idx;
  }

  return { serverIndex, episodeIndex };
}

/**
 * phimapi (and most Vietnamese sources) don't multiplex Vietsub + Thuyết
 * Minh into one file — they publish them as separate "servers", each named
 * after the audio/subtitle track it carries (e.g. "Vietsub #1", "Thuyết
 * Minh #1"). When that's the case, the server tabs ARE the language
 * switcher — this just detects it so the UI can say so instead of the
 * generic "Server" label, which makes the switch easy to miss.
 */
function detectServerLanguage(serverName: string): string | null {
  const raw = serverName.toLowerCase();
  if (/thuyết|thuyet/.test(raw)) return 'Thuyết Minh';
  if (/lồng|long tieng/.test(raw)) return 'Lồng Tiếng';
  if (/vietsub|phụ đề|phu de/.test(raw)) return 'Vietsub';
  return null;
}

/* ------------------------------------------------------------------ */
/* Related movies — "Bạn cũng có thể thích"                            */
/* ------------------------------------------------------------------ */

/**
 * Pulls a "franchise" search keyword out of a movie title, e.g.
 * "Thám Tử Lừng Danh Conan 28: Dư Ảnh Của Độc Nhân" -> "Thám Tử Lừng
 * Danh Conan", "Lật Mặt 7: Một Điều Ước" -> "Lật Mặt". Only returns a
 * value when something was actually stripped (a subtitle, a sequel
 * number, or a "Phần"/"Tập" marker) — a bare one-off title like "Mai"
 * is left alone so we don't fire off a noisy single-word keyword
 * search that would just surface unrelated movies that happen to share
 * a common word.
 */
function extractFranchiseKeyword(name?: string): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  const base = trimmed
    .split(/[:\-–—]/)[0]
    .replace(/\s+(phần|tập)\s+[ivxlcdm\d]+\s*$/i, '')
    .replace(/\s+\d+\s*$/, '')
    .trim();

  if (!base || base.length < 4) return undefined;
  if (normalizeVi(base) === normalizeVi(trimmed)) return undefined;
  return base;
}

function dedupeBySlugCapped(items: MovieListItem[], cap: number): MovieListItem[] {
  const seen = new Set<string>();
  const out: MovieListItem[] = [];
  for (const m of items) {
    if (!m?.slug || seen.has(m.slug) || out.length >= cap) continue;
    seen.add(m.slug);
    out.push(m);
  }
  return out;
}

function RelatedMovies({
  name,
  categorySlug,
  countrySlug,
  isChieuRap,
  currentSlug,
}: {
  name?: string;
  categorySlug?: string;
  countrySlug?: string;
  isChieuRap?: boolean;
  currentSlug?: string;
}) {
  const { t } = useTranslation();

  // Tier 1: same franchise/series — e.g. watching a Conan movie surfaces
  // other Conan movies, watching "Lật Mặt 7" surfaces other "Lật Mặt"
  // entries. Keyword search, then require the result's own title to
  // still start with the franchise keyword so unrelated partial-word
  // matches from the search API get filtered back out.
  const franchiseKeyword = extractFranchiseKeyword(name);
  const { data: franchiseData } = useSearchMovies({
    keyword: franchiseKeyword ?? '',
    limit: 24,
  });
  const normalizedFranchiseKeyword = franchiseKeyword ? normalizeVi(franchiseKeyword) : '';
  const franchiseMatches = (franchiseData?.items ?? []).filter(
    (m) =>
      m.slug !== currentSlug &&
      normalizeVi(m.name ?? '').startsWith(normalizedFranchiseKeyword),
  );

  // Tier 2: same "phim chiếu rạp" (cinema release) + same country — e.g.
  // watching a Vietnamese cinema release surfaces other Vietnamese
  // cinema releases instead of generic same-genre picks.
  const { data: chieuRapData } = useMoviesBySlug(
    isChieuRap ? 'phim-chieu-rap' : undefined,
    { page: 1 },
  );
  const chieuRapMatches = (chieuRapData?.items ?? []).filter((m) => {
    if (m.slug === currentSlug) return false;
    if (!countrySlug) return true;
    const itemCountries = (m as unknown as { country?: Array<{ slug: string }> }).country;
    return Array.isArray(itemCountries)
      ? itemCountries.some((c) => c?.slug === countrySlug)
      : true;
  });

  // Tier 3 (fallback): same genre, narrowed by country when we have one
  // — always fetched so there's something to fill the row with once
  // tiers 1-2 run dry.
  const { data: genreData } = useMoviesInGenre(categorySlug, {
    page: 1,
    country: countrySlug,
  });
  const genreMatches = (genreData?.items ?? []).filter((m) => m.slug !== currentSlug);

  const related = dedupeBySlugCapped(
    [...franchiseMatches, ...chieuRapMatches, ...genreMatches],
    12,
  );

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <MovieRow
        title={t('watch.youMightLike', 'Bạn cũng có thể thích')}
        movies={related}
      />
    </section>
  );
}

/**
 * Small floating "coming soon" bubble shown briefly under a control button
 * that doesn't have real backing functionality yet (watch-list, skip-intro,
 * watch-party, error reports) — so the button gives honest feedback instead
 * of silently doing nothing.
 */
function ComingSoonBubble({ align = 'center' }: { align?: 'center' | 'right' }) {
  const { t } = useTranslation();
  const posCls =
    align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`absolute top-full z-30 mt-2 whitespace-nowrap rounded-lg bg-[#18181b] px-3 py-1.5 text-xs font-medium text-gray-200 shadow-lg ring-1 ring-white/10 ${posCls}`}
    >
      {t('watch.comingSoon', 'Tính năng sắp ra mắt')}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* WatchPage                                                           */
/* ------------------------------------------------------------------ */

export default function WatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const tapParam = searchParams.get('tap');
  const svParam = searchParams.get('sv');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Wraps the iframe + logo watermark together so our own fullscreen
  // shortcut ('f' key) fullscreens both — otherwise fullscreening just
  // the iframe leaves the logo (a sibling element) behind and hidden.
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Track playback progress received from the same-origin player
  // wrapper via postMessage. Updated on every timeupdate event and
  // read when saving watch history.
  const playbackRef = useRef({ currentTime: 0, duration: 0 });

  /* ---- Data fetching ---- */
  // Propagate the source hint so the watch page loads the same film
  // the user reached via a vsmov search result.
  const preferSource = searchParams.get('src') as 'phimapi' | 'vsmov' | null;
  const { data, isLoading, isError } = useMovieDetail(slug, preferSource ?? undefined);
  const movie = data?.movie ?? null;
  const episodes = data?.episodes ?? [];

  // Real actor headshots (falls back to initials avatars when there's no
  // TMDB api key / tmdb id) — same source the movie detail page's
  // "Diễn viên" tab uses, so the cast grid looks consistent across pages.
  const { data: tmdbExtras } = useTmdbExtras(movie?.tmdb?.id, movie?.tmdb?.type);
  const tmdbCast = tmdbExtras?.cast ?? [];

  /* ---- Store ---- */
  const {
    cinemaMode,
    autoNext,
    setCurrentMovie,
    setCurrentEpisode,
    setCinemaMode,
    setAutoNext,
  } = usePlayerStore();

  const { addToHistory, getProgress } = useHistoryStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const isFav = movie ? isFavorite(movie.slug) : false;

  const handleToggleFavorite = useCallback(() => {
    if (!movie) return;
    if (isFav) {
      removeFavorite(movie.slug);
      return;
    }
    const item: MovieListItem = {
      _id: movie._id,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      year: movie.year,
      tmdb: movie.tmdb,
      imdb: movie.imdb,
      modified: movie.modified,
      episode_current: movie.episode_current ?? '',
      episode_total: movie.episode_total ?? '',
      quality: movie.quality ?? '',
      lang: movie.lang ?? '',
      type: movie.type ?? '',
      chieurap: movie.chieurap ?? false,
    };
    addFavorite(item);
  }, [movie, isFav, addFavorite, removeFavorite]);

  // Small self-contained "coming soon" bubble for controls that don't have
  // real backing functionality yet (watch-list, skip-intro, watch-party,
  // error reports) — shows a brief tooltip instead of silently doing
  // nothing, so the button doesn't feel broken.
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const showComingSoon = useCallback((label: string) => {
    setComingSoon(label);
    window.setTimeout(() => setComingSoon((cur) => (cur === label ? null : cur)), 1800);
  }, []);

  const [shareOpen, setShareOpen] = useState(false);

  /* ---- Resolve indices ---- */
  const { serverIndex, episodeIndex } = useMemo(
    () => resolveIndices(episodes, svParam, tapParam),
    [episodes, svParam, tapParam],
  );

  const currentServer = episodes[serverIndex] ?? null;
  const currentEpisodeData = currentServer?.server_data[episodeIndex] ?? null;
  // Prefer our same-origin player wrapper with the m3u8 stream so we
  // can receive postMessage events (ended, timeupdate) for auto-next
  // and progress tracking. Fall back to the upstream embed URL when no
  // m3u8 link is available.
  const embedUrl = currentEpisodeData?.link_m3u8
    ? `/player.html?url=${encodeURIComponent(currentEpisodeData.link_m3u8)}`
    : currentEpisodeData?.link_embed ?? '';

  /* ---- Sync store with resolved episode ---- */
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
    }
  }, [movie, setCurrentMovie]);

  useEffect(() => {
    setCurrentEpisode({ serverIndex, episodeIndex });
  }, [serverIndex, episodeIndex, setCurrentEpisode]);

  // Cinema mode is per-viewing-session UI state, not a user preference —
  // but it lives in the global `usePlayerStore`, so it doesn't reset on
  // its own. Since navigating between episodes of the SAME movie reuses
  // this same WatchPage instance (React Router doesn't remount it for a
  // route that only changes ?tap/&sv), cinemaMode correctly survives
  // episode switches. But it also survives switching to a DIFFERENT
  // movie for the same reason, which is the bug: leaving movie A while
  // fullscreen, then opening movie B, opens B already fullscreen because
  // the store's cinemaMode was never told "this is a new movie". Force
  // it back to false whenever the slug itself changes so only an actual
  // movie switch resets it, not an episode switch.
  useEffect(() => {
    setCinemaMode(false);
  }, [slug, setCinemaMode]);

  /* ---- Resume prompt ---- */
  const savedProgress = useMemo(() => {
    if (!slug || !currentEpisodeData) return 0;
    return getProgress(slug, currentEpisodeData.slug);
  }, [slug, currentEpisodeData, getProgress]);

  const [resumeDismissed, setResumeDismissed] = useState(false);
  const showResumePrompt = savedProgress > 0 && !resumeDismissed;

  // Reset dismiss state when episode changes
  useEffect(() => {
    setResumeDismissed(false);
  }, [serverIndex, episodeIndex]);

  /** Send a seek command to the player wrapper iframe. */
  const seekTo = useCallback((seconds: number) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { action: 'seek', time: seconds },
        '*',
      );
    } catch {
      // cross-origin fallback — can't seek into upstream embeds
    }
  }, []);

  const handleResume = useCallback(() => {
    seekTo(savedProgress);
    setResumeDismissed(true);
  }, [savedProgress, seekTo]);

  /* ---- Navigation helpers ---- */
  const navigateToEpisode = useCallback(
    (sIdx: number, eIdx: number) => {
      const server = episodes[sIdx];
      if (!server) return;
      const ep = server.server_data[eIdx];
      if (!ep) return;
      const srcParam = preferSource ? `&src=${preferSource}` : '';
      navigate(
        `${ROUTES.WATCH}/${slug}?tap=${ep.slug}&sv=${encodeURIComponent(server.server_name)}${srcParam}`,
        { replace: true },
      );
    },
    [episodes, slug, navigate, preferSource],
  );

  const hasPrevEpisode = episodeIndex > 0;
  const hasNextEpisode =
    currentServer != null && episodeIndex < currentServer.server_data.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrevEpisode) {
      navigateToEpisode(serverIndex, episodeIndex - 1);
    }
  }, [hasPrevEpisode, navigateToEpisode, serverIndex, episodeIndex]);

  const goToNext = useCallback(() => {
    if (hasNextEpisode) {
      navigateToEpisode(serverIndex, episodeIndex + 1);
    }
  }, [hasNextEpisode, navigateToEpisode, serverIndex, episodeIndex]);

  /* ---- Track playback progress from player wrapper postMessage ---- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.event === 'timeupdate') {
        playbackRef.current = {
          currentTime: e.data.currentTime ?? 0,
          duration: e.data.duration ?? 0,
        };
      }
      // Sent when the logo badge rendered inside player.html is clicked —
      // navigate via the router instead of a hard page reload.
      if (e.data.action === 'navigateHome') {
        navigate(ROUTES.HOME);
      }
      // iOS Safari can't DOM-fullscreen a container that wraps a <video>
      // (it hands the video to the native player, hiding all DOM overlays
      // including the logo watermark). player.html therefore skips native
      // fullscreen on iOS and asks us to "fake" it instead — our cinema
      // mode is exactly a fixed full-viewport overlay, so route the
      // player's fullscreen button to it. This keeps the logo visible on
      // iOS exactly like Android / desktop.
      if (e.data.action === 'toggleFullscreen') {
        setCinemaMode(!cinemaMode);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate, cinemaMode, setCinemaMode]);

  // Keep the in-iframe player's fullscreen button icon in sync with
  // cinema mode. On iOS that button toggles cinema mode instead of native
  // fullscreen, so whenever cinema mode changes (from the player button,
  // our own "Rạp phim" toggle, Esc, the exit pill or the backdrop) we
  // tell player.html to flip its button state.
  useEffect(() => {
    if (!embedUrl.startsWith('/player.html')) return;
    iframeRef.current?.contentWindow?.postMessage(
      { action: 'fullscreenState', state: cinemaMode },
      '*',
    );
  }, [embedUrl, cinemaMode]);

  // Reset progress when episode changes so stale values don't carry over
  useEffect(() => {
    playbackRef.current = { currentTime: 0, duration: 0 };
  }, [serverIndex, episodeIndex]);

  /* ---- Save watch history ----
     `beforeunload` almost never fires on mobile when the OS kills the
     tab/app from the task switcher — that's a hard process kill, not a
     page navigation, so browsers get no chance to run the handler.
     To make resume-progress reliable on mobile we:
       1. Save on `visibilitychange` -> 'hidden', which DOES fire
          reliably when a mobile browser is backgrounded (switching
          apps, locking the screen, swiping away), even if the process
          is later killed outright.
       2. Save on `pagehide` as a second safety net (works in more
          mobile Safari/Chrome cases than `beforeunload`).
       3. Save periodically (every 5s) while playing, so even in the
          worst case (instant kill with no events at all) we lose at
          most a few seconds of progress instead of the whole session. */
  useEffect(() => {
    const saveHistory = () => {
      if (!movie || !currentEpisodeData || !currentServer) return;
      if (playbackRef.current.currentTime <= 0) return;
      addToHistory({
        slug: movie.slug,
        name: movie.name,
        poster_url: movie.poster_url,
        thumb_url: movie.thumb_url,
        episode: currentEpisodeData.slug,
        server: currentServer.server_name,
        progress: Math.floor(playbackRef.current.currentTime),
        duration: Math.floor(playbackRef.current.duration),
        updatedAt: Date.now(),
        type: movie.type,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveHistory();
    };

    window.addEventListener('beforeunload', saveHistory);
    window.addEventListener('pagehide', saveHistory);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(saveHistory, 5000);

    return () => {
      window.removeEventListener('beforeunload', saveHistory);
      window.removeEventListener('pagehide', saveHistory);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
      saveHistory();
    };
  }, [movie, currentEpisodeData, currentServer, addToHistory]);

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          try {
            playerContainerRef.current?.requestFullscreen();
          } catch {
            /* fullscreen not supported */
          }
          break;
        case 'Escape':
          if (cinemaMode) {
            setCinemaMode(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, cinemaMode, setCinemaMode]);

  /* ---- Auto-next: listen for postMessage from the video iframe ----
     The upstream player broadcasts events on video end using several
     possible shapes (`ended`, `video:ended`, {type:'ended'}, ...). We
     accept any that carry a sane signal so we don't miss the trigger. */
  useEffect(() => {
    if (!autoNext) return;

    const isEndedSignal = (data: unknown): boolean => {
      if (typeof data === 'string') {
        return /ended|end|complete|finished/i.test(data);
      }
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        const flat = JSON.stringify(d).toLowerCase();
        if (/ended|"finish"|complete/.test(flat)) return true;
        if (d.type && typeof d.type === 'string') {
          return /end|finish|complete/i.test(d.type);
        }
        if (d.event && typeof d.event === 'string') {
          return /end|finish|complete/i.test(d.event);
        }
      }
      return false;
    };

    const handler = (e: MessageEvent) => {
      if (isEndedSignal(e.data)) {
        if (hasNextEpisode) goToNext();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [autoNext, hasNextEpisode, goToNext]);

  /* ---- Auto-next: TIMER FALLBACK based on movie.time ----
     Many cross-origin players don't broadcast an "ended" event, so we
     also arm a timer for the expected episode duration (movie.time in
     minutes) plus a small buffer. When it fires we advance if autoNext
     is on and there's a next episode. Timer resets whenever the
     episode / server changes so it never fires stale. */
  useEffect(() => {
    if (!autoNext || !hasNextEpisode || !movie?.time) return;

    // Parse "45", "45 phút", "1h 30m" style — grab minutes numerically.
    const raw = String(movie.time);
    const minMatch = raw.match(/\d+/);
    const minutes = minMatch ? parseInt(minMatch[0], 10) : 0;
    if (minutes <= 0 || minutes > 300) return;

    // Duration in ms + 15s safety buffer to let credits play out.
    const durationMs = minutes * 60 * 1000 + 15_000;
    const timer = setTimeout(() => {
      if (hasNextEpisode) goToNext();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [autoNext, hasNextEpisode, goToNext, movie?.time, serverIndex, episodeIndex]);

  /* ---- Loading / error states ---- */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-red-500" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center">
        <FaFilm className="mb-4 text-5xl text-gray-600" />
        <h2 className="mb-2 text-xl font-semibold text-gray-200">
          {t('common.error')}
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {movie.name}
          {currentEpisodeData ? ` - ${currentEpisodeData.name}` : ''}
        </title>
        <meta
          property="og:title"
          content={`${movie.name}${currentEpisodeData ? ` - ${currentEpisodeData.name}` : ''}`}
        />
        <meta property="og:image" content={getMoviePoster(movie.thumb_url, movie.poster_url)} />
        <meta property="og:url" content={`https://khonggianphim.online/xem/${slug}`} />
        <link rel="canonical" href={`https://khonggianphim.online/xem/${slug}`} />
      </Helmet>

      {/* Cinema mode backdrop — full-viewport dark surface. Clicking it
          exits cinema mode. Sits BEHIND the player (z-40) so the player
          (z-50) sits on top and appears "enlarged". */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
            onClick={() => setCinemaMode(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gray-950 text-white"
      >
        <div className="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
          {/* Player — full width, controls + two-column info sit below it. */}
          <div>
              {/* Player — when cinema mode is on, elevate to fixed
                  full-viewport (rạp thật sự phóng to). When off, sits
                  inline in the normal 16:9 responsive slot. */}
              <div
                className={
                  cinemaMode
                    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black'
                    : 'relative overflow-hidden rounded-xl bg-black'
                }
              >
                <div
                  ref={playerContainerRef}
                  className={
                    cinemaMode
                      ? 'relative w-full max-w-[100vw]'
                      : 'relative w-full'
                  }
                  style={
                    cinemaMode
                      ? { aspectRatio: '16 / 9', maxHeight: '100vh' }
                      : { paddingTop: '56.25%' }
                  }
                >
                  {embedUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={embedUrl}
                      className="absolute inset-0 h-full w-full"
                      allow="autoplay; fullscreen; encrypted-media"
                      // Only sandbox cross-origin embeds (upstream player).
                      // Our same-origin /player.html needs unrestricted
                      // access so postMessage works for auto-next.
                      {...(embedUrl.startsWith('/player.html')
                        ? {}
                        : { sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation' })}
                      allowFullScreen
                      title={currentEpisodeData?.name ?? movie.name}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <FaFilm className="text-4xl text-gray-600" />
                    </div>
                  )}

                  {/* Logo watermark — top-left corner of video, styled as a
                      rounded pill badge (icon + site name), matching the
                      khophim.org-style branding reference.
                      Only rendered for the cross-origin fallback embed. Our
                      own /player.html embed (the normal case) renders this
                      same badge itself, as an Artplayer *layer* living
                      inside the element that goes fullscreen — that's the
                      only way the logo survives the player's own fullscreen
                      button, since that button fullscreens the iframe's
                      internal player container, not this parent div. If we
                      also drew it here the two badges would double up. */}
                  {!embedUrl.startsWith('/player.html') && (
                    <Link
                      to={ROUTES.HOME}
                      className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-black/70"
                      title="Không Gian Phim"
                    >
                      <img
                        src="/logo.png"
                        alt="Không Gian Phim"
                        className="h-5 w-5 rounded-full object-cover sm:h-6 sm:w-6"
                        draggable={false}
                      />
                      <span className="text-xs font-semibold text-white drop-shadow-sm sm:text-sm">
                        Không Gian Phim
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Resume banner */}
              <AnimatePresence>
                {showResumePrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 flex items-center gap-3 rounded-lg bg-red-600/20 border border-red-600/30 px-4 py-3"
                  >
                    <FaPlay className="shrink-0 text-red-400" />
                    <p className="flex-1 text-sm text-gray-200">
                      {t('watch.resumePrompt')}{' '}
                      <span className="font-medium text-white">
                        {Math.floor(savedProgress / 60)}:{String(Math.floor(savedProgress % 60)).padStart(2, '0')}
                      </span>
                    </p>
                    <button
                      onClick={handleResume}
                      className="shrink-0 rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      {t('watch.resume')}
                    </button>
                    <button
                      onClick={() => setResumeDismissed(true)}
                      className="shrink-0 rounded-md bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-600"
                    >
                      {t('common.close', 'Bỏ qua')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

          {/* ---- Controls bar — full width, plain icon+label buttons under
               the player, mirroring the reference site's row (Yêu thích /
               Thêm vào / Chuyển tập / Bỏ qua giới thiệu / Rạp phim / Chia sẻ /
               Xem chung / Báo lỗi). Items without real backing functionality
               yet (Thêm vào, Bỏ qua giới thiệu, Xem chung, Báo lỗi) show a
               brief "coming soon" bubble instead of silently doing nothing. ---- */}
          <div className="relative mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
            >
              {isFav ? (
                <FaHeart className="h-[18px] w-[18px] text-[#FECF59]" />
              ) : (
                <FaRegHeart className="h-[18px] w-[18px]" />
              )}
              <span className="text-[11px] font-medium">{t('movie.addFavorite')}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => showComingSoon('addToList')}
                className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
              >
                <FaPlus className="h-[18px] w-[18px]" />
                <span className="text-[11px] font-medium">{t('movie.addToList')}</span>
              </button>
              {comingSoon === 'addToList' && <ComingSoonBubble />}
            </div>

            <button
              type="button"
              onClick={() => setAutoNext(!autoNext)}
              className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
            >
              <span className="inline-flex items-center gap-1.5">
                {autoNext ? (
                  <FaToggleOn className="h-[18px] w-[18px] text-[#FECF59]" />
                ) : (
                  <FaToggleOff className="h-[18px] w-[18px]" />
                )}
              </span>
              <span className="text-[11px] font-medium">{t('watch.autoNext')}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => showComingSoon('skipIntro')}
                className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
              >
                <FaForward className="h-[18px] w-[18px]" />
                <span className="text-[11px] font-medium">{t('watch.skipIntro')}</span>
              </button>
              {comingSoon === 'skipIntro' && <ComingSoonBubble />}
            </div>

            <button
              type="button"
              onClick={() => setCinemaMode(!cinemaMode)}
              className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
            >
              <span className="inline-flex items-center gap-1.5">
                {cinemaMode ? (
                  <FaToggleOn className="h-[18px] w-[18px] text-[#FECF59]" />
                ) : (
                  <FaToggleOff className="h-[18px] w-[18px]" />
                )}
              </span>
              <span className="text-[11px] font-medium">{t('watch.cinemaMode')}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
              >
                <FaShareAlt className="h-4 w-4" />
                <span className="text-[11px] font-medium">{t('movie.share')}</span>
              </button>
              <AnimatePresence>
                {shareOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShareOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 rounded-xl border border-white/10 bg-[#18181b] p-3 shadow-xl"
                    >
                      <ShareButtons url={window.location.href} title={movie.name} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => showComingSoon('watchParty')}
                className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
              >
                <FaUsers className="h-[18px] w-[18px]" />
                <span className="text-[11px] font-medium">{t('watch.watchParty')}</span>
              </button>
              {comingSoon === 'watchParty' && <ComingSoonBubble />}
            </div>

            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => showComingSoon('report')}
                className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
              >
                <FaFlag className="h-3.5 w-3.5" />
                {t('watch.reportError')}
              </button>
              {comingSoon === 'report' && <ComingSoonBubble align="right" />}
            </div>
          </div>

          {/* ---- Info row — poster + title/meta on the left, cast grid on
               the right, mirroring the reference layout below the player. ---- */}
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left: poster thumb + title/badges/status + short synopsis */}
            <div className="flex flex-1 gap-4 min-w-0">
              <Link
                to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                className="w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-28"
              >
                <img
                  src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                  alt={movie.name}
                  onError={onImgError}
                  className="w-full"
                />
              </Link>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <Link
                    to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                    className="text-lg font-bold text-white transition-colors hover:text-[#FECF59] sm:text-xl"
                  >
                    {movie.name}
                  </Link>
                  {movie.origin_name && movie.origin_name !== movie.name && (
                    <p className="text-sm italic text-[#FECF59]/80">{movie.origin_name}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {movie.tmdb?.vote_average ? (
                    <div className="flex items-center overflow-hidden rounded border border-solid border-[rgba(1,180,228,0.5)]">
                      <span className="bg-[#01B4E4] px-1.5 py-1 text-white">TMDb</span>
                      <span className="bg-[rgba(1,180,228,0.1)] px-1.5 py-1 text-white">
                        {movie.tmdb.vote_average}
                      </span>
                    </div>
                  ) : null}
                  {movie.year > 0 && (
                    <span className="rounded border border-white/15 bg-black/40 px-2.5 py-1 text-white/90">
                      {movie.year}
                    </span>
                  )}
                  {movie.quality && (
                    <span className="rounded bg-blue-600 px-2.5 py-1 text-white">
                      {movie.quality}
                    </span>
                  )}
                  {movie.lang && (
                    <span className="rounded bg-emerald-600 px-2.5 py-1 text-white">
                      {movie.lang}
                    </span>
                  )}
                  {currentServer && currentEpisodeData && (
                    <span className="rounded border border-white/15 bg-black/40 px-2.5 py-1 text-white/90">
                      {currentEpisodeData.name}
                    </span>
                  )}
                </div>

                {movie.category && movie.category.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {movie.category.slice(0, 4).map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/the-loai/${cat.slug}`}
                        className="rounded-full border border-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300 transition hover:border-[#FECF59] hover:text-[#FECF59]"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}

                {movie.content && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-400 sm:line-clamp-3">
                    {movie.content.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                <Link
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#FECF59] transition hover:text-[#fff1cc]"
                >
                  {t('watch.movieInfo')}
                  <FaChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Right: view count + cast grid */}
            <div className="w-full shrink-0 lg:w-72 xl:w-80">
              {movie.view ? (
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  <FaEye className="text-[#FECF59]" />
                  {movie.view.toLocaleString()} {t('movie.views')}
                </div>
              ) : null}

              {movie.actor && movie.actor.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">
                    {t('movie.cast')}
                  </h3>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-4">
                    {(tmdbCast.length > 0
                      ? tmdbCast.slice(0, 12).map((p) => ({
                          key: String(p.id),
                          name: p.name,
                          photo: getTmdbImageUrl(p.profile_path),
                        }))
                      : movie.actor.slice(0, 12).map((name) => ({
                          key: name,
                          name,
                          photo: null as string | null,
                        }))
                    ).map((person) => (
                      <div key={person.key} className="flex flex-col items-center gap-1.5 text-center">
                        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-gray-800 text-sm font-bold text-gray-500 ring-1 ring-white/10">
                          {person.photo ? (
                            <img
                              src={person.photo}
                              alt={person.name}
                              loading="lazy"
                              onError={onImgError}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FaUserCircle className="h-full w-full text-white/25" />
                          )}
                        </div>
                        <span className="line-clamp-2 text-[11px] leading-tight text-gray-400">
                          {person.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---- Episode section — full width, server/language tabs +
               collapsible episode grid (single "Danh sách tập" block,
               replacing the old split mobile/desktop sidebar). ---- */}
          {episodes.length > 0 && (() => {
            const hasMultipleEpisodes = episodes.some(
              (ep) => (ep.server_data?.length ?? 0) > 1,
            );

            return (
              <div className="mt-8">
                {episodes.length > 1 && (
                  <div className="mb-4">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                      {episodes.some((ep) => detectServerLanguage(ep.server_name))
                        ? t('watch.language', 'Ngôn ngữ')
                        : t('watch.server')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {episodes.map((ep, idx) => {
                        const lang = detectServerLanguage(ep.server_name);
                        return (
                          <button
                            key={ep.server_name}
                            onClick={() => navigateToEpisode(idx, 0)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                              idx === serverIndex
                                ? 'bg-[#FECF59] text-[#0f1115] shadow-md shadow-[#FECF59]/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                          >
                            {lang ? (
                              <FaLanguage className="h-3.5 w-3.5" />
                            ) : (
                              <FaServer className="h-3 w-3" />
                            )}
                            {lang ?? ep.server_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasMultipleEpisodes ? (
                  <EpisodeList
                    episodes={episodes}
                    currentEpisodeSlug={currentEpisodeData?.slug}
                    currentServerName={currentServer?.server_name}
                    movieSlug={movie.slug}
                    preferSource={preferSource ?? undefined}
                    showHeader={false}
                    collapsible
                  />
                ) : (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm text-gray-400">
                    {t('movie.singleMovieNote')}
                  </div>
                )}
              </div>
            );
          })()}

          {/* You might also like */}
          <RelatedMovies
            name={movie.name}
            categorySlug={movie.category?.[0]?.slug}
            countrySlug={movie.country?.[0]?.slug}
            isChieuRap={movie.chieurap}
            currentSlug={movie.slug}
          />
        </div>
      </motion.div>
    </>
  );
}