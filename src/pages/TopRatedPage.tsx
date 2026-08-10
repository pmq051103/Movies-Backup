import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { useMoviesBySlug } from '@/hooks';
import { LoadingOverlay } from '@/components/common';
import { getMoviePoster, onImgError } from '@/utils';

const TABS = [
  { key: 'top10', count: 10 },
  { key: 'top50', count: 50 },
  { key: 'top100', count: 100 },
] as const;

export default function TopRatedPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'top10' | 'top50' | 'top100'>('top10');

  const { data, isLoading } = useMoviesBySlug('phim-moi-cap-nhat', { page: 1 });

  const selectedCount = TABS.find((tab) => tab.key === activeTab)!.count;

  const movies = useMemo(() => {
    if (!data?.items) return [];
    return data.items.slice(0, selectedCount);
  }, [data, selectedCount]);

  return (
    <>
      <Helmet>
        <title>{t('seo.topRatedTitle')}</title>
        <meta name="description" content="Bảng xếp hạng phim hay nhất, phim đánh giá cao nhất tại Không Gian Phim. Top phim đáng xem." />
        <meta property="og:title" content={t('seo.topRatedTitle')} />
        <meta property="og:description" content="Top phim đánh giá cao nhất, phim hay đáng xem." />
        <meta property="og:url" content="https://khonggianphim.online/top-rated" />
        <link rel="canonical" href="https://khonggianphim.online/top-rated" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen px-4 py-8 md:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-3xl font-bold text-white md:text-4xl">
            {t('topRated.title')}
          </h1>

          <div className="mb-8 flex gap-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {t(`topRated.${tab.key}`)}
              </button>
            ))}
          </div>

          {isLoading && <LoadingOverlay />}

          <div className="space-y-4">
            {movies.map((movie, index) => (
              <motion.div
                key={movie.slug}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  to={`/phim/${movie.slug}`}
                  className="group flex items-center gap-4 rounded-xl bg-zinc-900/60 p-3 transition-all duration-300 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-black/20 md:gap-6 md:p-4"
                >
                  <span
                    className="min-w-[3rem] text-center text-5xl font-black md:min-w-[4.5rem] md:text-7xl"
                    style={{
                      background: 'linear-gradient(180deg, #e50914 0%, #b20710 50%, #5c0410 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {index + 1}
                  </span>

                  <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg md:h-32 md:w-22">
                    <img
                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                      alt={movie.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={onImgError}
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="text-base font-semibold text-white transition-colors group-hover:text-red-500 md:text-lg">
                      {movie.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      {movie.year && <span>{movie.year}</span>}
                      {movie.tmdb?.vote_average && Number(movie.tmdb.vote_average) > 0 && (
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          {Number(movie.tmdb.vote_average).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
