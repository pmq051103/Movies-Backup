import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaPlay } from 'react-icons/fa';

import {
  HeroBanner,
  MovieRow,
  SpotlightGrid,
  TopRankingRow,
  MovieCarousel,
  AnimeShowcase,
} from '@/components/movie';
import { SectionTitle } from '@/components/common';
import { useHistoryStore } from '@/store';
import {
  useLatestMovies,
  useMoviesBySlug,
  useGenres,
  useHeroMovies,
} from '@/hooks';
import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';

/* -------------------------------------------------------------------------- */
/* Animation                                                                   */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

/* -------------------------------------------------------------------------- */
/* TopicCards — "Bạn đang quan tâm gì?" gradient cards (cobephim.biz feature) */
/* -------------------------------------------------------------------------- */

const TOPIC_GRADIENTS = [
  'linear-gradient(135deg, #c64a80 0%, #8b2b54 100%)',
  'linear-gradient(135deg, #4aa686 0%, #296d55 100%)',
  'linear-gradient(135deg, #cf7852 0%, #8f4b30 100%)',
  'linear-gradient(135deg, #d96172 0%, #993b4a 100%)',
  'linear-gradient(135deg, #5b7bd5 0%, #3b4f8f 100%)',
];

interface TopicCardsProps {
  genres: Array<{ _id: number; name: string; slug: string }>;
}

function TopicCards({ genres }: TopicCardsProps) {
  const topics = genres.slice(0, 6);

  if (topics.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="mb-4 text-[22px] font-bold leading-tight text-white sm:text-[26px] lg:text-[30px]">
        Bạn đang quan tâm gì?
      </h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((genre, idx) => (
          <Link
            key={genre._id}
            to={`${ROUTES.GENRES}/${genre.slug}`}
            className="group relative flex h-[86px] min-w-[140px] flex-col justify-between overflow-hidden rounded-[24px_64px_24px_24px] p-3.5 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:h-[126px] sm:min-w-[240px] sm:rounded-[32px_100px_32px_32px] sm:p-6 lg:h-[138px] lg:min-w-0"
            style={{ background: TOPIC_GRADIENTS[idx % TOPIC_GRADIENTS.length] }}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110 sm:h-32 sm:w-32" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_58%)]" />
            <div className="relative z-10 flex h-full w-full flex-col justify-between">
              <h3 className="line-clamp-2 select-none pr-[28%] text-[14px] font-bold leading-tight sm:text-[19px] lg:text-[20px]">
                {genre.name}
              </h3>
              <span className="mt-auto inline-flex select-none items-center gap-0.5 text-[10px] font-semibold text-white/90 sm:text-[13px]">
                Xem toàn bộ
                <FaChevronRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-3.5 sm:w-3.5" />
              </span>
            </div>
          </Link>
        ))}

        {genres.length > 6 && (
          <Link
            to={ROUTES.GENRES}
            className="group relative flex h-[86px] min-w-[140px] flex-col justify-between overflow-hidden rounded-[24px_64px_24px_24px] p-3.5 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:h-[126px] sm:min-w-[240px] sm:rounded-[32px_100px_32px_32px] sm:p-6 lg:hidden"
            style={{ background: '#303443' }}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110 sm:h-32 sm:w-32" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_58%)]" />
            <div className="relative z-10 flex h-full w-full flex-col justify-between">
              <h3 className="line-clamp-2 select-none pr-[28%] text-[14px] font-bold leading-tight sm:text-[19px] lg:text-[20px]">
                +{genres.length - 6} chủ đề
              </h3>
              <span className="mt-auto inline-flex select-none items-center gap-0.5 text-[10px] font-semibold text-white/95 sm:text-[13px]">
                Khám phá
                <FaChevronRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-3.5 sm:w-3.5" />
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* HomePage                                                                    */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const { t } = useTranslation();
  const { history } = useHistoryStore();

  /* ── Data feeds ── */
  const { data: latestData } = useLatestMovies(1);
  const { data: latestPage2 } = useLatestMovies(2);
  const { data: latestPage3 } = useLatestMovies(3);
  const { data: genres } = useGenres();
  const { data: singleMovies } = useMoviesBySlug('phim-le', { page: 1 });
  const { data: tvShows } = useMoviesBySlug('phim-bo', { page: 1 });
  const { data: anime } = useMoviesBySlug('hoat-hinh', { page: 1 });
  const { data: tvShowsCategory } = useMoviesBySlug('tv-shows', { page: 1 });
  const { data: vietsub } = useMoviesBySlug('phim-vietsub', { page: 1 });
  const { data: thuyetMinh } = useMoviesBySlug('phim-thuyet-minh', { page: 1 });
  const { data: longTieng } = useMoviesBySlug('phim-long-tieng', { page: 1 });

  const { data: topMoviesByViews } = useMoviesBySlug('phim-le', {
    page: 1, sort_field: 'view_total', sort_type: 'desc',
  });
  const { data: topSeriesByViews } = useMoviesBySlug('phim-bo', {
    page: 1, sort_field: 'view_total', sort_type: 'desc',
  });

  const { data: nowPlayingData } = useMoviesBySlug('phim-chieu-rap', { page: 1 });
  const { data: topRatedData } = useMoviesBySlug('phim-le', {
    page: 1, sort_field: 'tmdb.vote_average', sort_type: 'desc',
  });
  const { data: topNowPlayingByRating } = useMoviesBySlug('phim-chieu-rap', {
    page: 1, sort_field: 'tmdb.vote_average', sort_type: 'desc',
  });
  const { data: topVietCinema } = useMoviesBySlug('phim-chieu-rap', {
    page: 1, country: 'viet-nam', sort_field: 'modified.time', sort_type: 'desc',
  });
  const currentYear = new Date().getFullYear();
  const { data: blockbusterData } = useMoviesBySlug('phim-le', {
    page: 1, sort_field: 'view_total', sort_type: 'desc', year: currentYear,
    country: 'au-my',
  });
  const { data: subteamData } = useMoviesBySlug('subteam', { page: 1 });
  const { data: upcomingData } = useMoviesBySlug('phim-sap-chieu', {
    page: 1, status: 'trailer',
  });

  /* ── Derived data ── */
  const heroBannerMovies = useMemo(
    () => latestData?.items.slice(0, 6) ?? [],
    [latestData],
  );
  const heroSlides = useHeroMovies(heroBannerMovies, 5);

  const continueWatchingItems = useMemo(
    () =>
      history.map((h) => ({
        slug: h.slug,
        name: h.name,
        poster_url: h.poster_url,
        thumb_url: h.thumb_url,
        episode: h.episode,
        server: h.server,
        watchUrl: `${ROUTES.WATCH}/${h.slug}?tap=${h.episode}${
          h.server ? `&sv=${encodeURIComponent(h.server)}` : ''
        }`,
      })),
    [history],
  );

  const updatedTodayItems = useMemo(() => {
    const all = [
      ...(latestData?.items ?? []),
      ...(latestPage2?.items ?? []),
      ...(latestPage3?.items ?? []),
    ];
    const today = new Date().toISOString().slice(0, 10);
    const seen = new Set<string>();
    return all.filter((m: any) => {
      if (!m?.slug || seen.has(m.slug)) return false;
      seen.add(m.slug);
      const modTime = m.modified?.time;
      if (!modTime) return false;
      return new Date(modTime).toISOString().slice(0, 10) === today;
    });
  }, [latestData, latestPage2, latestPage3]);

  const spotlightItems = useMemo(
    () => latestData?.items.slice(6, 14) ?? [],
    [latestData],
  );

  const nowPlayingSpotlight = useMemo(
    () => nowPlayingData?.items?.slice(0, 10) ?? [],
    [nowPlayingData],
  );

  const animeSpotlight = useMemo(
    () => anime?.items?.slice(0, 13) ?? [],
    [anime],
  );

  const vietCinemaSpotlight = useMemo(
    () => topVietCinema?.items?.slice(0, 8) ?? [],
    [topVietCinema],
  );

  const blockbusterSpotlight = useMemo(
    () => blockbusterData?.items?.slice(0, 8) ?? [],
    [blockbusterData],
  );

  return (
    <>
      <Helmet>
        <title>{t('seo.homeTitle')}</title>
        <meta name="description" content={t('seo.homeDescription')} />
        <meta property="og:title" content={t('seo.homeTitle')} />
        <meta property="og:description" content={t('seo.homeDescription')} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-[#191b24] text-white">
        {heroSlides.length > 0 && <HeroBanner movies={heroSlides} />}

        <div className="mx-auto w-full mt-8 space-y-14 px-4 pb-16 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-14"
          >
            {/* ── Bạn đang quan tâm gì? (cobephim topic cards) ── */}
            <motion.section variants={itemVariants}>
              <TopicCards genres={genres ?? []} />
            </motion.section>

            {/* ── Continue Watching (horizontal scroll) ── */}
            {continueWatchingItems.length > 0 && (
              <motion.section variants={itemVariants}>
                <SectionTitle
                  title={t('home.continueWatching')}
                  viewAllLink={ROUTES.HISTORY}
                />
                <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {continueWatchingItems.map((item) => (
                    <Link
                      key={item.slug}
                      to={item.watchUrl}
                      className="group relative flex-shrink-0"
                      aria-label={`Xem tiếp ${item.name}`}
                      title={item.name}
                    >
                      <div className="relative aspect-[2/3] w-32 overflow-hidden rounded-xl bg-gray-900 sm:w-40">
                        <img
                          src={getMoviePoster(item.poster_url, item.thumb_url)}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={onImgError}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffd166] text-[#0f111a] shadow-lg">
                            <FaPlay className="h-4 w-4 translate-x-0.5" />
                          </div>
                        </div>
                        {item.episode && (
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                            Tập {item.episode}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 max-w-[8rem] truncate text-sm font-medium text-gray-300 sm:max-w-[10rem]">
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── Phim Đề Cử — Spotlight (1 big + 4 small) ── */}
            {spotlightItems.length >= 5 && (
              <motion.section variants={itemVariants}>
                <SpotlightGrid
                  title={t('home.spotlight', 'Phim đề cử')}
                  movies={spotlightItems}
                />
              </motion.section>
            )}

            {/* ── Phim Mới Cập Nhật Hôm Nay ── */}
            {updatedTodayItems.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.newToday', 'Phim Mới Cập Nhật Hôm Nay')}
                  movies={updatedTodayItems}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Chiếu Rạp — landscape carousel, 10 titles ── */}
            {nowPlayingSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <MovieCarousel
                  title={t('home.nowPlaying', 'Phim Chiếu Rạp')}
                  movies={nowPlayingSpotlight}
                  viewAllLink={ROUTES.NOW_PLAYING}
                  variant="cinema"
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Bom Tấn — Spotlight ── */}
            {blockbusterSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <SpotlightGrid
                  title={t('home.blockbuster', 'Phim Bom Tấn')}
                  movies={blockbusterSpotlight}
                  viewAllLink={ROUTES.MOVIES + '?sortField=view_total&sortType=desc&year=' + currentYear}
                />
              </motion.section>
            )}

            {/* ── Top 10 Bom Tấn — Ranking ⭐ ── */}
            {blockbusterData?.items && blockbusterData.items.length > 5 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topBlockbuster', 'Top 10 Bom Tấn ' + currentYear)}
                  movies={blockbusterData.items.slice(5)}
                  viewAllLink={ROUTES.MOVIES + '?sortField=view_total&sortType=desc&year=' + currentYear}
                  showRating
                />
              </motion.section>
            )}

            {/* ── Top Phim Đáng Xem — Ranking ⭐ ── */}
            {topRatedData?.items && topRatedData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topMustWatch', 'Top Phim Đáng Xem')}
                  movies={topRatedData.items}
                  viewAllLink={ROUTES.TOP_RATED}
                  showRating
                />
              </motion.section>
            )}

            {/* ── Phim Việt Chiếu Rạp — Spotlight ── */}
            {vietCinemaSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <SpotlightGrid
                  title={t('home.topVietCinema', 'Phim Việt Chiếu Rạp')}
                  movies={vietCinemaSpotlight}
                  viewAllLink={ROUTES.NOW_PLAYING + '?country=viet-nam'}
                />
              </motion.section>
            )}

            {/* ── Phim Lẻ Mới — horizontal scroll ── */}
            {singleMovies?.items && singleMovies.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.latestMovies')}
                  movies={singleMovies.items}
                  viewAllLink={ROUTES.MOVIES}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Top 10 Chiếu Rạp — Ranking ⭐ ── */}
            {topNowPlayingByRating?.items && topNowPlayingByRating.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topNowPlaying', 'Top 10 Chiếu Rạp')}
                  movies={topNowPlayingByRating.items}
                  viewAllLink={ROUTES.NOW_PLAYING}
                  showRating
                />
              </motion.section>
            )}

            {/* ── Phim Bộ Mới — horizontal scroll ── */}
            {tvShows?.items && tvShows.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.latestTVShows')}
                  movies={tvShows.items}
                  viewAllLink={ROUTES.TV_SHOWS}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Top 10 Phim Lẻ — Ranking by views ── */}
            {topMoviesByViews?.items && topMoviesByViews.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topMovies', 'Top 10 Phim Lẻ')}
                  movies={topMoviesByViews.items}
                  viewAllLink={ROUTES.MOVIES}
                />
              </motion.section>
            )}

            {/* ── Phim Sắp Cập Nhật — trailer-only landscape carousel, 10 titles ── */}
            {upcomingData?.items && upcomingData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieCarousel
                  title={t('home.upcoming', 'Phim Sắp Cập Nhật')}
                  movies={upcomingData.items}
                  viewAllLink={ROUTES.MOVIES + '?status=trailer'}
                  variant="upcoming"
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Anime — big spotlight panel + thumbnail filmstrip ── */}
            {animeSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <AnimeShowcase
                  title={t('home.anime')}
                  movies={animeSpotlight}
                  viewAllLink={ROUTES.ANIME}
                  limit={13}
                />
              </motion.section>
            )}

            {/* ── Top 10 Phim Bộ — Ranking by views ── */}
            {topSeriesByViews?.items && topSeriesByViews.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topSeries', 'Top 10 Phim Bộ')}
                  movies={topSeriesByViews.items}
                  viewAllLink={ROUTES.TV_SHOWS}
                />
              </motion.section>
            )}

            {/* ── TV Shows — horizontal scroll ── */}
            {tvShowsCategory?.items && tvShowsCategory.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.tvShowsCategory', 'TV Shows')}
                  movies={tvShowsCategory.items}
                  viewAllLink={ROUTES.TV_SHOW_PROGRAMS}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Vietsub — horizontal scroll ── */}
            {vietsub?.items && vietsub.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.vietsub', 'Phim Vietsub')}
                  movies={vietsub.items}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Thuyết Minh — horizontal scroll ── */}
            {thuyetMinh?.items && thuyetMinh.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.thuyetMinh', 'Phim Thuyết Minh')}
                  movies={thuyetMinh.items}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Lồng Tiếng — horizontal scroll ── */}
            {longTieng?.items && longTieng.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.longTieng', 'Phim Lồng Tiếng')}
                  movies={longTieng.items}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Subteam Đề Cử — horizontal scroll ── */}
            {subteamData?.items && subteamData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.subteam', 'Subteam Đề Cử')}
                  movies={subteamData.items}
                  limit={10}
                />
              </motion.section>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
