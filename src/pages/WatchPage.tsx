import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaStepBackward,
  FaStepForward,
  FaServer,
  FaFilm,
  FaToggleOn,
  FaToggleOff,
  FaPlay,
} from 'react-icons/fa';

import { EpisodeList, MovieRow } from '@/components/movie';
import { ROUTES } from '@/constants';
import { useMovieDetail, useMoviesInGenre } from '@/hooks';
import { usePlayerStore, useHistoryStore } from '@/store';
import { getMoviePoster } from '@/utils';
import type { Episode } from '@/types';

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

/* ------------------------------------------------------------------ */
/* Related movies — "Bạn cũng có thể thích"                            */
/* ------------------------------------------------------------------ */

function RelatedMovies({
  categorySlug,
  currentSlug,
}: {
  categorySlug?: string;
  currentSlug?: string;
}) {
  const { t } = useTranslation();
  const { data } = useMoviesInGenre(categorySlug, { page: 1 });

  const related = (data?.items ?? [])
    .filter((m) => m.slug !== currentSlug)
    .slice(0, 12);

  if (!categorySlug || related.length === 0) return null;

  return (
    <section className="mt-12">
      <MovieRow
        title={t('watch.youMightLike', 'Bạn cũng có thể thích')}
        movies={related}
      />
    </section>
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
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

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
            iframeRef.current?.requestFullscreen();
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

      {/* Small "exit cinema mode" pill that floats top-right in cinema mode */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setCinemaMode(false)}
            className="fixed right-4 top-4 z-[70] rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            {t('watch.exitCinema', 'Thoát rạp')}  (Esc)
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gray-950 text-white"
      >
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          {/* Main layout: player + sidebar */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left column: player + controls */}
            <div className="flex-1">
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

                  {/* Logo watermark — top-right corner of video */}
                  <Link
                    to={ROUTES.HOME}
                    className="pointer-events-auto absolute right-3 top-3 z-10 opacity-40 transition-opacity hover:opacity-80"
                    title="Không Gian Phim"
                  >
                    <img
                      src="/logo.png"
                      alt="Không Gian Phim"
                      className="h-8 w-auto drop-shadow-lg sm:h-10"
                      draggable={false}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}
                    />
                  </Link>
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

              {/* Movie info */}
              <div className="mt-4 space-y-1">
                <Link
                  to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                  className="text-xl font-bold text-white transition-colors hover:text-red-400"
                >
                  {movie.name}
                </Link>
                {movie.origin_name && movie.origin_name !== movie.name && (
                  <p className="text-sm italic text-gray-500">{movie.origin_name}</p>
                )}
                {currentEpisodeData && (
                  <p className="text-sm text-gray-400">
                    {currentEpisodeData.name}
                  </p>
                )}
                {/* Compact meta badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {movie.year > 0 && (
                    <span className="rounded bg-white/10 px-2 py-0.5 text-gray-300">
                      {movie.year}
                    </span>
                  )}
                  {movie.quality && (
                    <span className="rounded bg-blue-600 px-2 py-0.5 font-semibold text-white">
                      {movie.quality}
                    </span>
                  )}
                  {movie.lang && (
                    <span className="rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white">
                      {movie.lang}
                    </span>
                  )}
                  {movie.time && (
                    <span className="text-gray-400">{movie.time}</span>
                  )}
                </div>
              </div>

              {/* Player controls bar */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {/* Prev / Next buttons */}
                <button
                  onClick={goToPrev}
                  disabled={!hasPrevEpisode}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaStepBackward className="h-3.5 w-3.5" />
                  {t('watch.prevEpisode')}
                </button>

                <button
                  onClick={goToNext}
                  disabled={!hasNextEpisode}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('watch.nextEpisode')}
                  <FaStepForward className="h-3.5 w-3.5" />
                </button>

                <div className="ml-auto flex items-center gap-4">
                  {/* Auto next toggle */}
                  <button
                    onClick={() => setAutoNext(!autoNext)}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {autoNext ? (
                      <FaToggleOn className="h-5 w-5 text-red-500" />
                    ) : (
                      <FaToggleOff className="h-5 w-5" />
                    )}
                    {t('watch.autoNext')}
                  </button>

                  {/* Cinema mode toggle */}
                  <button
                    onClick={() => setCinemaMode(!cinemaMode)}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {cinemaMode ? (
                      <FaToggleOn className="h-5 w-5 text-red-500" />
                    ) : (
                      <FaToggleOff className="h-5 w-5" />
                    )}
                    {t('watch.cinemaMode')}
                  </button>
                </div>
              </div>

              {/* Server tabs */}
              {episodes.length > 1 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    {t('watch.server')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {episodes.map((ep, idx) => (
                      <button
                        key={ep.server_name}
                        onClick={() => navigateToEpisode(idx, 0)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          idx === serverIndex
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <FaServer className="h-3 w-3" />
                        {ep.server_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Episode list — only show when the movie has real episodes.
                  Single-"Full" phim lẻ hides the sidebar entirely to avoid a
                  meaningless "Xem Phim" button on a page you're already
                  watching. Instead, show a subtle single-episode notice. */}
              {(() => {
                const hasMultipleEpisodes =
                  episodes.length > 1 ||
                  (currentServer?.server_data.length ?? 0) > 1;

                if (!hasMultipleEpisodes) {
                  return (
                    <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm text-gray-400 lg:hidden">
                      {t("movie.singleMovieNote")}
                    </div>
                  );
                }

                return (
                  <div className="mt-6 lg:hidden">
                    <EpisodeList
                      episodes={episodes}
                      currentEpisodeSlug={currentEpisodeData?.slug}
                      currentServerName={currentServer?.server_name}
                      movieSlug={movie.slug}
                      preferSource={preferSource ?? undefined}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Right sidebar (desktop only) — only when there are real episodes */}
            {(episodes.length > 1 ||
              (currentServer?.server_data.length ?? 0) > 1) && (
              <div className="hidden w-80 shrink-0 lg:block xl:w-96">
                <div className="sticky top-20">
                  <EpisodeList
                    episodes={episodes}
                    currentEpisodeSlug={currentEpisodeData?.slug}
                    currentServerName={currentServer?.server_name}
                    movieSlug={movie.slug}
                    preferSource={preferSource ?? undefined}
                    compact
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description + meta panel — meta block on the LEFT, overview on
              the RIGHT to give the description the wider column. */}
          {(movie.content || movie.category?.length || movie.director?.length) && (
            <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <aside className="space-y-4 rounded-xl border border-gray-800 bg-gray-900/60 p-5 text-sm lg:order-1">
                {movie.category && movie.category.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t('movie.genres', 'Thể loại')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {movie.category.map((g) => (
                        <Link
                          key={g.id}
                          to={`/the-loai/${g.slug}`}
                          className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {movie.country && movie.country.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t('movie.country', 'Quốc gia')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {movie.country.map((c) => (
                        <Link
                          key={c.id}
                          to={`/quoc-gia/${c.slug}`}
                          className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {movie.director && movie.director.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t('movie.director')}
                    </h4>
                    <p className="text-gray-300">{movie.director.join(', ')}</p>
                  </div>
                )}
                {movie.actor && movie.actor.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t('movie.cast')}
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      {movie.actor.slice(0, 8).join(', ')}
                      {movie.actor.length > 8 && '…'}
                    </p>
                  </div>
                )}
              </aside>

              <div className="lg:col-span-2 lg:order-2">
                <h2 className="mb-3 text-lg font-semibold text-white">
                  {t('movie.overview')}
                </h2>
                <div
                  className="rich-text prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: movie.content || '' }}
                />
              </div>
            </section>
          )}

          {/* You might also like */}
          <RelatedMovies
            categorySlug={movie.category?.[0]?.slug}
            currentSlug={movie.slug}
          />
        </div>
      </motion.div>
    </>
  );
}