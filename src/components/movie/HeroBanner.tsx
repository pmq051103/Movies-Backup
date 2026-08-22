import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router';
import { FaHeart, FaRegHeart, FaInfoCircle, FaPlay } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import { useFavoriteStore } from '@/store';
import type { HeroSlide } from '@/hooks/useMovieQueries';

interface HeroBannerProps {
  movies: HeroSlide[];
}

const MAX_SLIDES = 5;
const AUTOPLAY_INTERVAL = 6000;

/** Strip HTML tags from the API `content` for a clean banner description. */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}



const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Subscribe to the `favorites` array itself (not the `isFavorite` method —
  // selecting a stable method reference never changes identity, so the
  // component wouldn't re-render when favorites change and the heart icon
  // would silently fail to flip after a click).
  // NOTE: `useShallow` is required here — without it, `.map()` returns a new
  // array reference on every render, which makes useSyncExternalStore think
  // the store changed on every render and causes an infinite re-render loop
  // ("Maximum update depth exceeded").
  const favoriteSlugs = useFavoriteStore(
    useShallow((s) => s.favorites.map((f) => f.slug)),
  );
  const isFavorite = useCallback(
    (slug: string) => favoriteSlugs.includes(slug),
    [favoriteSlugs],
  );
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  // Filter out slides with empty image URLs
  const slides = movies.filter((m) =>
    (typeof m.thumb_url === 'string' && m.thumb_url.length > 0) ||
    (typeof m.poster_url === 'string' && m.poster_url.length > 0),
  ).slice(0, MAX_SLIDES);

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
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
  }, [slides.length, clearAutoplay]);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      startAutoplay();
    },
    [startAutoplay],
  );

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [startAutoplay, clearAutoplay]);

  if (!slides.length) return null;

  const detailUrl = (m: HeroSlide) =>
    m._source && m._source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${m.slug}?src=${m._source}`
      : `${ROUTES.MOVIE_DETAIL}/${m.slug}`;

  return (
    <section className="always-dark relative w-full">
      {/* Container — exact tophim aspect/margins. `lg:-mt-16` pulls it up
          under the transparent desktop header. */}
      <div className="relative w-full aspect-[390/240] sm:aspect-[390/240] md:aspect-video lg:aspect-[21/10] bg-[#191b24] overflow-visible md:overflow-hidden group mb-24 md:mb-0 lg:-mt-16">
        <div className="absolute inset-0 w-full h-full z-10 overflow-hidden">
          {slides.map((movie, idx) => {
            const active = idx === currentIndex;
            // Prefer a wide TMDB backdrop (proper 16:9 landscape) so the
            // banner isn't a cropped/zoomed portrait thumb. Fall back to
            // thumb_url, then poster_url.
            const src =
              typeof movie.backdrop_url === 'string' && movie.backdrop_url.length > 0
                ? movie.backdrop_url
                : typeof movie.thumb_url === 'string' && movie.thumb_url.length > 0
                  ? getMoviePoster(movie.thumb_url, movie.poster_url)
                  : getMoviePoster(movie.poster_url, movie.thumb_url);
            const rating = movie.tmdb?.vote_average
              ? parseFloat(String(movie.tmdb.vote_average))
              : null;
            const quality = movie.quality
              ? movie.quality.toUpperCase()
              : '';

            return (
              <div
                key={movie._id ?? movie.slug}
                className={`absolute inset-0 w-full h-full transition-opacity duration-[1200ms] ease-in-out ${
                  active ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-10 pointer-events-none'
                }`}
              >
                <div className="w-full h-full relative">
                  {/* Ken Burns background */}
                  <div
                    className={`absolute inset-0 bg-[#191b24] transition-transform duration-[1800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                      active ? 'translate-x-0 scale-100' : 'translate-x-[4%] scale-[1.03]'
                    }`}
                  >
                    <img
                      src={src}
                      alt={movie.name}
                      className="object-cover object-center w-full h-full"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      onError={onImgError}
                    />
                  </div>

                  {/* Dot grid overlay (desktop) */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 hidden md:block"
                    style={{
                      backgroundImage:
                        'radial-gradient(rgba(0, 0, 0, 0.4) 0.4px, transparent 1px)',
                      backgroundSize: '3px 3px',
                    }}
                  />

                  {/* Mobile gradient — fades all the way down to the exact
                      page background color (#191b24) with a soft multi-stop
                      curve, instead of stopping at a different near-black
                      tone and leaving a visible seam where the banner ends
                      and the page background begins. */}
                  <div
                    className="absolute inset-0 pointer-events-none md:hidden"
                    style={{
                      background:
                        'linear-gradient(to top, #191b24 0%, rgba(25,27,36,0.94) 12%, rgba(25,27,36,0.6) 30%, rgba(25,27,36,0.15) 55%, transparent 75%), radial-gradient(transparent 55%, rgba(25,27,36,0.65) 100%)',
                    }}
                  />

                  {/* Desktop gradient — same idea: soft multi-stop fade
                      down to the page background color instead of a hard
                      cutoff. */}
                  <div
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(25,27,36,0.6) 0%, rgba(25,27,36,0.1) 30%, transparent 60%), linear-gradient(to top, #191b24 0%, rgba(25,27,36,0.92) 10%, rgba(25,27,36,0.55) 28%, rgba(25,27,36,0.12) 50%, transparent 68%), radial-gradient(transparent 60%, rgba(25,27,36,0.75) 100%)',
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 z-20 flex items-end pb-0 md:pb-[6vw] lg:pb-[5vw] xl:pb-32 pointer-events-none">
                    <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 pointer-events-auto">
                      <div
                        className={`max-w-xl mx-auto md:mx-0 md:max-w-[50vw] lg:max-w-2xl flex flex-col items-center md:items-start text-center md:text-left relative top-0 md:top-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                          active
                            ? 'translate-x-0 opacity-100 delay-[200ms]'
                            : '-translate-x-[15%] opacity-0 delay-0'
                        }`}
                      >
                        <div className="mb-1 md:mb-4 lg:mb-6">
                          {/* Mobile title */}
                          <h2
                            className="md:hidden text-lg font-bold text-white drop-shadow-md"
                            style={{ fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif" }}
                          >
                            {movie.name}
                          </h2>
                          {/* Desktop title — consistent tophim-style display
                              typography with a subtle gold-to-white sheen. */}
                          <h2
                            className="hidden md:block leading-[1.05] text-4xl md:text-6xl xl:text-7xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)]"
                            style={{
                              fontFamily: "var(--font-display), 'Be Vietnam Pro', 'Inter', sans-serif",
                              fontWeight: 800,
                              letterSpacing: '-0.02em',
                              backgroundImage:
                                'linear-gradient(180deg, #ffffff 0%, #fff 55%, #fecf59 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                            }}
                          >
                            {movie.name}
                          </h2>
                        </div>

                        {movie.origin_name && movie.origin_name !== movie.name && (
                          <p className="text-[#FECF59] text-xs md:text-xs lg:text-sm mb-2 md:mb-3 lg:mb-4 font-medium drop-shadow">
                            {movie.origin_name}
                          </p>
                        )}

                        {/* Meta chips */}
                        <div className="flex justify-center md:justify-start items-center flex-wrap gap-2 mb-3 md:mb-4 text-[10px] md:text-xs text-white/90">
                          {quality && (
                            <span
                              className="inline-flex items-center justify-center rounded-[4px] text-[#141414] font-black leading-none tracking-normal h-[22px] px-2 text-[11px]"
                              style={{
                                backgroundColor: 'rgb(255, 216, 117)',
                                backgroundImage:
                                  'linear-gradient(220deg, rgb(255, 216, 117) 0%, rgb(255, 231, 168) 45%, rgb(255, 255, 255) 100%)',
                              }}
                            >
                              {quality}
                            </span>
                          )}
                          {movie.year > 0 && (
                            <span className="px-2 py-[3px] rounded border border-white/20 bg-black/40">
                              {movie.year}
                            </span>
                          )}
                          {movie.episode_current && (
                            <span className="px-2 py-[3px] rounded border border-white bg-black/40">
                              {movie.episode_current}
                            </span>
                          )}
                          {rating !== null && rating > 0 && (
                            <div className="flex items-center text-[10px] md:text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                              <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">
                                TMDb
                              </span>
                              <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">
                                {rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Description (desktop) */}
                        {movie.content && (
                          <div className="hidden md:block mb-4 lg:mb-8 max-w-sm lg:max-w-lg">
                            <p className="text-xs lg:text-sm text-white/90 font-light leading-relaxed line-clamp-2 lg:line-clamp-3">
                              {stripHtml(movie.content)}
                            </p>
                          </div>
                        )}

                          {/* Actions (desktop) */}
                          <div className="hidden md:flex justify-center md:justify-start items-center gap-4">
                            {movie.has_episodes !== false && (
                              <Link
                                to={`${ROUTES.WATCH}/${movie.slug}`}
                                title={t('movie.watchNow')}
                                className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-[#0f1115] rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(254,207,89,0.5)] shrink-0"
                                style={{
                                  background:
                                    'linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))',
                                }}
                              >
                                <FaPlay className="relative w-6 h-6 md:w-8 md:h-8 text-[#0f1115] translate-x-0.5" />
                              </Link>
                            )}

                            <div className="flex bg-white/5 border border-white/20 rounded-full backdrop-blur-md h-10 md:h-12 lg:h-14 items-center overflow-hidden">
                              <button
                                type="button"
                                className="group/btn w-16 md:w-20 h-full flex items-center justify-center transition-all text-white active:scale-75"
                                title={t('nav.favorites')}
                                onClick={() => toggleFavorite(movie)}
                                aria-label={t('nav.favorites')}
                              >
                                {isFavorite(movie.slug) ? (
                                  <FaHeart className="w-5 h-5 md:w-6 md:h-6 text-[#FECF59] transition-all duration-500 ease-in-out group-hover/btn:scale-110" />
                                ) : (
                                  <FaRegHeart className="w-5 h-5 md:w-6 md:h-6 text-white transition-all duration-500 ease-in-out group-hover/btn:scale-110" />
                                )}
                              </button>
                              <div className="w-[1px] h-3/5 bg-white/20" />
                              <Link
                                to={detailUrl(movie)}
                                className="group/link w-16 md:w-20 h-full flex items-center justify-center transition-colors text-white"
                                title={t('movie.moreInfo')}
                              >
                                <FaInfoCircle className="w-5 h-5 md:w-6 md:h-6 text-white group-hover/link:text-[#FECF59] transition-colors" />
                              </Link>
                            </div>
                          </div>

                          {/* Actions — desktop only. Mobile drops these 3
                              buttons entirely: the whole slide is already
                              a tap-through link to the detail page (see
                              below), so a separate play/favorite/info row
                              here would just be redundant clutter. */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: whole slide links to detail (below content so
                      the watch/favorite/info buttons stay tappable) */}
                  <Link
                    to={detailUrl(movie)}
                    className="absolute inset-0 z-10 md:hidden"
                    title={t('movie.moreInfo')}
                    aria-label={`${t('movie.moreInfo')} ${movie.name}`}
                  />
                </div>
            );
          })}
        </div>

        {/* Thumbnail nav strip */}
        {slides.length > 1 && (
          <div
            className="absolute -bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-30 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)] md:max-w-md lg:max-w-lg pb-2 md:pb-0 snap-x px-2 pointer-events-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {slides.map((slide, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={slide._id ?? slide.slug}
                  type="button"
                  aria-label={`${t('movie.goToSlide')} ${idx + 1}`}
                  onClick={() => goToSlide(idx)}
                  className={`relative shrink-0 w-[14vw] sm:w-[10vw] md:w-[7vw] lg:w-[6vw] xl:w-[5vw] max-w-[40px] md:max-w-[75px] lg:max-w-[85px] aspect-square md:aspect-[16/9] transition-all duration-300 rounded-full md:rounded-lg overflow-hidden snap-center transform-gpu border-2 ${
                    active
                      ? 'border-white/90 opacity-100 scale-100 shadow-md'
                      : 'border-transparent opacity-80 scale-95 hover:scale-100 hover:opacity-100'
                  }`}
                  style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                >
                  <img
                    src={
                      typeof slide.backdrop_url === 'string' && slide.backdrop_url.length > 0
                        ? slide.backdrop_url
                        : typeof slide.thumb_url === 'string' && slide.thumb_url.length > 0
                          ? getMoviePoster(slide.thumb_url, slide.poster_url)
                          : getMoviePoster(slide.poster_url, slide.thumb_url)
                    }
                    alt={slide.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
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

export default memo(HeroBanner);
