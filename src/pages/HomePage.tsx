import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaPlay } from 'react-icons/fa';

import {
  HeroBanner,
  MovieRow,
  TopRankingRow,
  MovieCarousel,
  AnimeShowcase,
  Phim4KSection,
  DetectiveSection,
} from '@/components/movie';
import { SectionTitle } from '@/components/common';
import { useHistoryStore } from '@/store';
import {
  useLatestMovies,
  useMoviesBySlug,
  useMoviesInGenre,
  useSearchMovies,
  useVsmov4K,
  useHeroMovies,
} from '@/hooks';
import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import type { MovieListItem } from '@/types';

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
/* TopicCards — "Bạn đang quan tâm gì?" gradient shortcut cards               */
/* -------------------------------------------------------------------------- */

interface TopicCard {
  title: string;
  to: string;
  cta: string;
  gradient: string;
  /** Optional small badge shown before the title (e.g. 4K, IMDb). */
  badge?: string;
}

const TOPIC_CARDS: TopicCard[] = [
  {
    title: 'Phim Chiếu Rạp',
    to: ROUTES.NOW_PLAYING,
    cta: 'Xem toàn bộ',
    gradient: 'linear-gradient(135deg, #b58b1f 0%, #8a6410 100%)',
  },
  {
    title: 'Thuyết Minh',
    to: ROUTES.THUYET_MINH,
    cta: 'Xem toàn bộ',
    gradient: 'linear-gradient(135deg, #c64a80 0%, #8b2b54 100%)',
  },
  {
    title: 'Phim 4K',
    to: ROUTES.PHIM_4K,
    cta: 'Xem tất cả',
    gradient: 'linear-gradient(135deg, #1f1147 0%, #3a1c71 45%, #c2410c 100%)',
    badge: '4K',
  },
  {
    title: 'Lồng Tiếng Cực Mạnh',
    to: ROUTES.LONG_TIENG,
    cta: 'Xem toàn bộ',
    gradient: 'linear-gradient(135deg, #4aa686 0%, #296d55 100%)',
  },
  {
    title: 'Anime mới',
    to: ROUTES.ANIME,
    cta: 'Xem toàn bộ',
    gradient: 'linear-gradient(135deg, #5b7bd5 0%, #3b4f8f 100%)',
  },
  {
    title: 'Cổ Trang Trung Quốc',
    to: ROUTES.CO_TRANG_TQ,
    cta: 'Xem toàn bộ',
    gradient: 'linear-gradient(135deg, #cf7852 0%, #8f4b30 100%)',
  },
];

function TopicCards() {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-[22px] font-bold leading-tight text-white sm:text-[26px] lg:text-[30px]">
        Bạn đang quan tâm gì?
      </h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOPIC_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group relative flex h-[86px] min-w-[140px] flex-col justify-between overflow-hidden rounded-[24px_64px_24px_24px] p-3.5 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:h-[126px] sm:min-w-[240px] sm:rounded-[32px_100px_32px_32px] sm:p-6 lg:h-[138px] lg:min-w-0"
            style={{ background: card.gradient }}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110 sm:h-32 sm:w-32" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_58%)]" />
            <div className="relative z-10 flex h-full w-full flex-col justify-between">
              <div className="flex items-center gap-1.5">
                {card.badge && (
                  <span className="inline-flex items-center rounded-md bg-[linear-gradient(135deg,#ffd166,#ff9f43)] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#1a1205] sm:text-[11px]">
                    {card.badge}
                  </span>
                )}
                <h3 className="line-clamp-2 select-none pr-[20%] text-[14px] font-bold leading-tight sm:text-[19px] lg:text-[20px]">
                  {card.title}
                </h3>
              </div>
              <span className="mt-auto inline-flex select-none items-center gap-0.5 text-[10px] font-semibold text-white/95 sm:text-[13px]">
                {card.cta}
                <FaChevronRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-3.5 sm:w-3.5" />
              </span>
            </div>
          </Link>
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
  const { data: anime } = useMoviesBySlug('hoat-hinh', { page: 1 });
  const { data: vietsub } = useMoviesBySlug('phim-vietsub', { page: 1 });
  const { data: longTieng } = useMoviesBySlug('phim-long-tieng', { page: 1 });

  const { data: topMoviesByViews } = useMoviesBySlug('phim-le', {
    page: 1, sort_field: 'view_total', sort_type: 'desc',
  });
  const { data: topSeriesByViews } = useMoviesBySlug('phim-bo', {
    page: 1, sort_field: 'view_total', sort_type: 'desc',
  });

  const { data: nowPlayingData } = useMoviesBySlug('phim-chieu-rap', { page: 1 });
  const { data: subteamData } = useMoviesBySlug('subteam', { page: 1 });
  const { data: upcomingData } = useMoviesBySlug('phim-sap-chieu', {
    page: 1, status: 'trailer',
  });

  /* ── New homepage sections (funny renames + 4K) ── */
  // Horror — "Tôi Sợ Con Người Em Rồi Đó, nhưng Không Bằng Sợ Ma"
  const { data: horrorData } = useMoviesInGenre('kinh-di', { page: 1 });
  // Doraemon — "Ăn cơm cùng Doraemon"
  const { data: doraemonData } = useSearchMovies({ keyword: 'doraemon', limit: 24 });
  // Conan — "Hồ Sơ Vụ Án Chưa Khép Lại" (thám tử bí ẩn)
  const { data: conanData } = useSearchMovies({ keyword: 'conan', limit: 24 });
  // Phim 4K — vsmov premium 4K catalog
  const { data: phim4kData } = useVsmov4K(1);

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

  const nowPlayingSpotlight = useMemo(
    () => nowPlayingData?.items?.slice(0, 10) ?? [],
    [nowPlayingData],
  );

  const animeSpotlight = useMemo(
    () => anime?.items?.slice(0, 13) ?? [],
    [anime],
  );

  // Conan search cũng dính vài phim khác chứa chữ "conan" — chỉ giữ lại
  // phim có quốc gia Nhật Bản VÀ thuộc thể loại bí ẩn / hình sự / trình
  // thám (search endpoint kèm mảng `country` + `category`).
  const conanItems = useMemo(() => {
    const items = (conanData?.items ?? []) as Array<
      MovieListItem & {
        country?: Array<{ slug?: string; name?: string }>;
        category?: Array<{ slug?: string; name?: string }>;
      }
    >;
    const MYSTERY = ['bi-an', 'hinh-su', 'trinh-tham', 'hai-huoc'];
    return items.filter((m) => {
      const isJapan = m.country?.some(
        (c) =>
          c.slug === 'nhat-ban' ||
          (c.name ?? '').toLowerCase().includes('nhật'),
      );
      if (!isJapan) return false;
      const isMystery = m.category?.some((c) => {
        const name = (c.name ?? '').toLowerCase();
        return (
          MYSTERY.includes(c.slug ?? '') ||
          name.includes('bí ẩn') ||
          name.includes('hình sự') ||
          name.includes('trình thám')
        );
      });
      return isMystery;
    });
  }, [conanData]);

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
              <TopicCards />
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

            {/* ── Phim Điện Ảnh Mới Coóng ── */}
            {updatedTodayItems.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.newToday', 'Phim Điện Ảnh Mới Coóng')}
                  movies={updatedTodayItems}
                  viewAllLink={ROUTES.MOVIES}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Top 10 phim bộ hôm nay — Ranking by views ── */}
            {topSeriesByViews?.items && topSeriesByViews.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topSeries', 'Top 10 phim bộ hôm nay')}
                  movies={topSeriesByViews.items}
                  viewAllLink={ROUTES.TV_SHOWS}
                />
              </motion.section>
            )}

            {/* ── Mãn Nhãn với Phim Chiếu Rạp — landscape carousel ── */}
            {nowPlayingSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <MovieCarousel
                  title={t('home.nowPlaying', 'Mãn Nhãn với Phim Chiếu Rạp')}
                  movies={nowPlayingSpotlight}
                  viewAllLink={ROUTES.NOW_PLAYING}
                  variant="cinema"
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Phim Sắp Tới Trên Rổ — trailer-only landscape carousel ── */}
            {upcomingData?.items && upcomingData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieCarousel
                  title={t('home.upcoming', 'Phim Sắp Tới Trên Rổ')}
                  movies={upcomingData.items}
                  viewAllLink={ROUTES.MOVIES + '?status=trailer'}
                  variant="upcoming"
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Top 10 Phim Lẻ Hay Nhức Nách — Ranking by views ── */}
            {topMoviesByViews?.items && topMoviesByViews.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <TopRankingRow
                  title={t('home.topMovies', 'Top 10 Phim Lẻ Hay Nhức Nách')}
                  movies={topMoviesByViews.items}
                  viewAllLink={ROUTES.MOVIES}
                />
              </motion.section>
            )}

            {/* ── Kho Tàng Anime Mới Nhất — spotlight panel + filmstrip ── */}
            {animeSpotlight.length >= 5 && (
              <motion.section variants={itemVariants}>
                <AnimeShowcase
                  title={t('home.anime', 'Kho Tàng Anime Mới Nhất')}
                  movies={animeSpotlight}
                  viewAllLink={ROUTES.ANIME}
                  limit={13}
                />
              </motion.section>
            )}

            {/* ── Tôi Sợ Con Người Em Rồi Đó, nhưng Không Bằng Sợ Ma (Kinh dị) ── */}
            {horrorData?.items && horrorData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.horror', 'Tôi Sợ Con Người Em Rồi Đó, nhưng Không Bằng Sợ Ma')}
                  movies={horrorData.items}
                  viewAllLink={ROUTES.GENRE_DETAIL('kinh-di')}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Ăn cơm cùng Doraemon ── */}
            {doraemonData?.items && doraemonData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <MovieRow
                  title={t('home.doraemon', 'Ăn cơm cùng Doraemon')}
                  movies={doraemonData.items}
                  viewAllLink={ROUTES.SEARCH + '?q=doraemon'}
                  limit={10}
                />
              </motion.section>
            )}

            {/* ── Hồ Sơ Vụ Án Chưa Khép Lại (Conan / thám tử bí ẩn) ── */}
            {conanItems.length > 0 && (
              <motion.section variants={itemVariants}>
                <DetectiveSection
                  title={t('home.conan', 'Hồ Sơ Vụ Án Chưa Khép Lại')}
                  movies={conanItems}
                  viewAllLink={ROUTES.SEARCH + '?q=conan'}
                  limit={12}
                />
              </motion.section>
            )}

            {/* ── Phim 4K — premium showcase (vsmov 4K catalog) ── */}
            {phim4kData?.items && phim4kData.items.length > 0 && (
              <motion.section variants={itemVariants}>
                <Phim4KSection
                  title={t('home.phim4k', 'Phim 4K')}
                  movies={phim4kData.items}
                  viewAllLink={ROUTES.PHIM_4K}
                  limit={12}
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
