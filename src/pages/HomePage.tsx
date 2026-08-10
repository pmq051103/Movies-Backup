import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';

import {
  HeroBanner,
  MovieCard,
  SpotlightGrid,
  TopRankingRow,
} from '@/components/movie';
import PromoBanner from '@/components/movie/PromoBanner';
import StatsBlock from '@/components/movie/StatsBlock';
import Sidebar from '@/components/movie/Sidebar';
import { SectionTitle } from '@/components/common';
import { useHistoryStore } from '@/store';
import { useLatestMovies, useMoviesBySlug } from '@/hooks';
import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import type { MovieListItem } from '@/types';

/* -------------------------------------------------------------------------- */
/* Animation                                                                   */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

/* -------------------------------------------------------------------------- */
/* SectionGrid — replaces MovieRow with a proper grid (no horizontal scroll)  */
/* -------------------------------------------------------------------------- */

interface SectionGridProps {
  title: string;
  movies: MovieListItem[];
  viewAllLink?: string;
  /** How many items to show. Defaults to 12. */
  limit?: number;
}

function SectionGrid({ title, movies, viewAllLink, limit = 12 }: SectionGridProps) {
  const items = movies.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section>
      <SectionTitle title={title} viewAllLink={viewAllLink} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((movie) => (
          <MovieCard key={movie._id ?? movie.slug} movie={movie} />
        ))}
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
  // Top phim Việt chiếu rạp
  const { data: topVietCinema } = useMoviesBySlug('phim-chieu-rap', {
    page: 1, country: 'viet-nam', sort_field: 'modified.time', sort_type: 'desc',
  });
  // Phim bom tấn — most viewed movies of current year (Hollywood blockbusters)
  const currentYear = new Date().getFullYear();
  const { data: blockbusterData } = useMoviesBySlug('phim-le', {
    page: 1, sort_field: 'view_total', sort_type: 'desc', year: currentYear,
  });
  const { data: subteamData } = useMoviesBySlug('subteam', { page: 1 });

  /* ── Derived data ── */
  const heroBannerMovies = useMemo(
    () => latestData?.items.slice(0, 6) ?? [],
    [latestData],
  );

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


  // Movies updated TODAY — filter across 3 pages (~72 items) by modified date
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
    () => nowPlayingData?.items?.slice(0, 8) ?? [],
    [nowPlayingData],
  );

  const animeSpotlight = useMemo(
    () => anime?.items?.slice(0, 8) ?? [],
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

      <div className="min-h-screen bg-gray-950 text-white">
        {heroBannerMovies.length > 0 && <HeroBanner movies={heroBannerMovies} />}

        <StatsBlock
          totalMovies={latestData?.pagination?.totalItems}
          updatedTodayCount={updatedTodayItems.length}
        />

        <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-8">
        {/* Main content */}
        <motion.div
          className="min-w-0 flex-1 space-y-14"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Continue Watching (horizontal scroll OK for this one) ── */}
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
                    <div className="relative aspect-[2/3] w-32 overflow-hidden rounded-lg bg-gray-900 sm:w-40">
                      <img
                        src={getMoviePoster(item.poster_url, item.thumb_url)}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={onImgError}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
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
              <SectionGrid
                title={t('home.newToday', 'Phim Mới Cập Nhật Hôm Nay')}
                movies={updatedTodayItems}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── BOOM BANNER 1 — Chiếu rạp hot ── */}
          {nowPlayingData?.items && nowPlayingData.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <PromoBanner movie={nowPlayingData.items[0]} accent="red" />
            </motion.section>
          )}


          {/* ── Phim Chiếu Rạp — Spotlight (1 big + 4 small) ── */}
          {nowPlayingSpotlight.length >= 5 && (
            <motion.section variants={itemVariants}>
              <SpotlightGrid
                title={t('home.nowPlaying', 'Phim Chiếu Rạp')}
                movies={nowPlayingSpotlight}
                viewAllLink={ROUTES.NOW_PLAYING}
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

          {/* ── Top Phim Bom Tấn — Ranking ⭐ ── */}
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

          {/* ── BOOM BANNER 2 — Top rated pick ── */}
          {topRatedData?.items && topRatedData.items.length > 1 && (
            <motion.section variants={itemVariants}>
              <PromoBanner movie={topRatedData.items[1]} accent="blue" />
            </motion.section>
          )}

          {/* ── Phim Lẻ Mới — Grid ── */}
          {singleMovies?.items && singleMovies.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.latestMovies')}
                movies={singleMovies.items}
                viewAllLink={ROUTES.MOVIES}
                limit={12}
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

          {/* ── BOOM BANNER 3 — Phim Việt pick ── */}
          {topVietCinema?.items && topVietCinema.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <PromoBanner movie={topVietCinema.items[0]} accent="purple" />
            </motion.section>
          )}

          {/* ── Phim Bộ Mới — Grid ── */}
          {tvShows?.items && tvShows.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.latestTVShows')}
                movies={tvShows.items}
                viewAllLink={ROUTES.TV_SHOWS}
                limit={12}
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

          {/* ── BOOM BANNER 4 — Subteam pick ── */}
          {subteamData?.items && subteamData.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <PromoBanner movie={subteamData.items[0]} accent="green" />
            </motion.section>
          )}

          {/* ── Anime — Spotlight (1 big + 4 small) ── */}
          {animeSpotlight.length >= 5 && (
            <motion.section variants={itemVariants}>
              <SpotlightGrid
                title={t('home.anime')}
                movies={animeSpotlight}
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

          {/* ── TV Shows — Grid ── */}
          {tvShowsCategory?.items && tvShowsCategory.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.tvShowsCategory', 'TV Shows')}
                movies={tvShowsCategory.items}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── Phim Vietsub — Grid ── */}
          {vietsub?.items && vietsub.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.vietsub', 'Phim Vietsub')}
                movies={vietsub.items}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── Phim Thuyết Minh — Grid ── */}
          {thuyetMinh?.items && thuyetMinh.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.thuyetMinh', 'Phim Thuyết Minh')}
                movies={thuyetMinh.items}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── Phim Lồng Tiếng — Grid ── */}
          {longTieng?.items && longTieng.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.longTieng', 'Phim Lồng Tiếng')}
                movies={longTieng.items}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── Subteam Đề Cử — Grid ── */}
          {subteamData?.items && subteamData.items.length > 0 && (
            <motion.section variants={itemVariants}>
              <SectionGrid
                title={t('home.subteam', 'Subteam Đề Cử')}
                movies={subteamData.items}
                limit={12}
              />
            </motion.section>
          )}

          {/* ── Hướng Dẫn & FAQ (SEO) ── */}
          <motion.section variants={itemVariants} className="mt-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-bold text-white sm:text-2xl">
                Hướng Dẫn Xem Phim Tại Không Gian Phim
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-red-500">Làm sao để xem phim?</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Chọn phim bạn muốn xem, bấm vào poster hoặc tên phim để vào trang chi tiết. Sau đó bấm nút "Xem Ngay" để bắt đầu xem. Nếu máy chủ 1 không hoạt động, hãy chuyển sang máy chủ khác.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-red-500">Phim không tải được?</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Hãy thử đổi máy chủ (Server) khác. Không Gian Phim tổng hợp nhiều nguồn phim nên luôn có máy chủ dự phòng cho bạn.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-red-500">Tìm phim như thế nào?</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Bấm vào icon kính lúp trên thanh header để tìm kiếm theo tên phim. Hoặc duyệt theo thể loại, quốc gia, phim chiếu rạp từ menu điều hướng.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-red-500">Lưu phim yêu thích?</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Bấm vào icon trái tim ở trang chi tiết phim để lưu vào danh sách yêu thích. Truy cập nhanh từ icon ❤️ trên thanh header.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* Right sidebar */}
        <div className="hidden w-72 shrink-0 xl:block">
          <Sidebar
            topRated={topRatedData?.items}
            trending={topMoviesByViews?.items}
            hotWeekly={topSeriesByViews?.items}
          />
        </div>
        </div>
        </div>
      </div>
    </>
  );
}
