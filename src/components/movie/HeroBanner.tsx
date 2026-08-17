import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants';
import { getMoviePoster } from '@/utils';
import type { MovieListItem } from '@/types';

interface HeroBannerProps {
  movies: MovieListItem[];
}

const MAX_SLIDES = 5;
const AUTOPLAY_INTERVAL = 6000;

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
  }),
};

const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [failedSlugs, setFailedSlugs] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filter out slides with empty URLs AND slides whose images failed to load
  const slides = movies
    .filter((m) =>
      !failedSlugs.has(m.slug) && (
        (typeof m.thumb_url === 'string' && m.thumb_url.length > 0) ||
        (typeof m.poster_url === 'string' && m.poster_url.length > 0)
      )
    )
    .slice(0, MAX_SLIDES);

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
  }, [slides.length, clearAutoplay]);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      startAutoplay();
    },
    [currentIndex, startAutoplay],
  );

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    startAutoplay();
  }, [slides.length, startAutoplay]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    startAutoplay();
  }, [slides.length, startAutoplay]);

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [startAutoplay, clearAutoplay]);

  if (!slides.length) return null;

  const current = slides[currentIndex];
  const currentRating = current.tmdb?.vote_average
    ? parseFloat(String(current.tmdb.vote_average))
    : null;

  return (
    <section className="always-dark relative w-full">
      {/* ────────────────────────────────────────────────────────────────
          MOBILE (< sm): full-bleed hero like tophim — aspect 390/240,
          backdrop image + gradient overlay + overlaid info.
          ──────────────────────────────────────────────────────────────── */}
      <div className="relative sm:hidden">
        <div className="relative w-full aspect-[390/240] bg-[#0f1115] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={current._id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={getMoviePoster(current.thumb_url, current.poster_url)}
                alt={current.name}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover object-top"
                onError={() => {
                  setFailedSlugs((prev) => new Set(prev).add(current.slug));
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* tophim mobile gradients */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgb(15, 17, 26) 5%, rgba(15, 17, 21, 0.6) 30%, transparent 60%), radial-gradient(transparent 60%, rgba(15, 17, 26, 0.7) 100%)',
            }}
          />

          {/* Rating pill top-right */}
          {currentRating !== null && currentRating > 0 && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-[#fecf59] backdrop-blur">
              <FaStar className="h-3 w-3" />
              {currentRating.toFixed(1)}
            </span>
          )}

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <Link to={`${ROUTES.MOVIE_DETAIL}/${current.slug}`}>
              <h1 className="line-clamp-2 text-[20px] font-bold leading-tight text-white pr-[28%]">
                {current.name}
              </h1>
              {current.origin_name && current.origin_name !== current.name && (
                <p className="mt-0.5 line-clamp-1 pr-[28%] text-xs italic text-gray-300/90">
                  {current.origin_name}
                </p>
              )}
            </Link>

            <div className="mt-2 flex items-center gap-2.5">
              <Link
                to={`${ROUTES.WATCH}/${current.slug}`}
                className="btn-gold inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-bold text-[#0f111a]"
              >
                <FaPlay className="h-3 w-3" />
                {t('movie.watchNow')}
              </Link>
              <Link
                to={`${ROUTES.MOVIE_DETAIL}/${current.slug}`}
                className="inline-flex h-9 items-center rounded-lg border border-white/25 bg-white/10 px-4 text-[13px] font-semibold text-white backdrop-blur-sm"
              >
                {t('movie.moreInfo', 'Chi tiết')}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              aria-label={t('common.previous')}
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              aria-label={t('common.next')}
            >
              <FaChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Mobile dots */}
        {slides.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((slide, idx) => (
              <button
                key={slide._id}
                onClick={() => goToSlide(idx)}
                aria-label={`${t('movie.goToSlide')} ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'h-2.5 w-2.5 bg-[#ffd166]'
                    : 'h-1.5 w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────
          DESKTOP (>= sm): cinematic full-bleed hero with gradient
          overlays + right thumbnail strip.
          ──────────────────────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden sm:block sm:aspect-auto sm:min-h-[560px] sm:h-[70vh] sm:max-h-[820px]">
        <div className="absolute inset-0 bg-black" />
        {/* Background image with AnimatePresence */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current._id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={getMoviePoster(current.thumb_url, current.poster_url)}
              alt={current.name}
              className="h-full w-full object-cover"
              loading={currentIndex === 0 ? 'eager' : 'lazy'}
              onError={() => {
                setFailedSlugs((prev) => new Set(prev).add(current.slug));
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Title */}
                  <h1 className="line-clamp-2 text-4xl font-bold leading-tight text-white [text-shadow:0_2px_1px_rgba(0,0,0,0.3)] drop-shadow-lg md:text-5xl lg:text-[3em]">
                    {current.name}
                  </h1>

                  {/* Subtitle / origin name */}
                  {current.origin_name && current.origin_name !== current.name && (
                    <p className="mt-2 line-clamp-1 text-lg italic text-gray-300 md:text-xl">
                      {current.origin_name}
                    </p>
                  )}

                  {/* Meta line: year · rating */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    {current.year > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="rounded bg-white/10 px-2.5 py-0.5 font-medium backdrop-blur-sm">
                          {current.year}
                        </span>
                      </span>
                    )}
                    {currentRating !== null && currentRating > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-[#fecf59]">
                        <FaStar className="h-3.5 w-3.5" />
                        {currentRating.toFixed(1)}
                      </span>
                    )}
                    {current.episode_current && (
                      <span className="hidden lg:inline-flex">
                        {current.episode_current}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      to={`${ROUTES.MOVIE_DETAIL}/${current.slug}`}
                      className="btn-gold inline-flex h-[50px] items-center gap-2.5 rounded-md px-6 text-sm font-bold text-[#0f111a]"
                    >
                      <FaPlay className="h-4 w-4" />
                      <span>{t('movie.watchNow')}</span>
                    </Link>
                    <Link
                      to={`${ROUTES.MOVIE_DETAIL}/${current.slug}`}
                      className="inline-flex h-[50px] items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      <span>{t('movie.moreInfo', 'Chi tiết')}</span>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Previous / Next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-70 transition-opacity hover:bg-black/70"
              aria-label={t('common.previous')}
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-70 transition-opacity hover:bg-black/70"
              aria-label={t('common.next')}
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide._id}
                onClick={() => goToSlide(idx)}
                aria-label={`${t('movie.goToSlide')} ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'h-3 w-3 bg-[#ffd166] shadow-md shadow-[#ffd166]/50'
                    : 'h-2 w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip — desktop right side */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 right-8 z-10 hidden w-[280px] flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-2 backdrop-blur-md xl:flex">
            {slides.slice(0, 5).map((slide, idx) => (
              <button
                key={slide._id}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`flex items-center gap-2 overflow-hidden rounded-[.4rem] border-2 text-left transition-all duration-200 ${
                  idx === currentIndex
                    ? 'border-[#ffd166]/80'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="relative h-[45px] w-[65px] shrink-0 overflow-hidden bg-[#18181b]">
                  <img
                    src={getMoviePoster(slide.thumb_url, slide.poster_url)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="truncate pr-2 text-xs font-medium text-white">
                  {slide.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(HeroBanner);
