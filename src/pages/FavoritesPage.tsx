import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaHeart, FaTimes, FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useFavoriteStore } from '@/store';
import { EmptyState } from '@/components/common';
import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { favorites, removeFavorite } = useFavoriteStore();

  return (
    <>
      <Helmet>
        <title>{t('seo.favoritesTitle')}</title>
        <meta name="description" content="Danh sách phim yêu thích của bạn tại Không Gian Phim." />
        <meta property="og:title" content={t('seo.favoritesTitle')} />
        <meta property="og:url" content="https://khonggianphim.online/yeu-thich" />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://khonggianphim.online/yeu-thich" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen px-4 py-8 md:px-8 lg:px-12"
      >
        <div className="mx-auto w-full">
          <h1 className="mb-8 text-3xl font-bold text-white md:text-4xl">
            {t('favorites.title')}
          </h1>

          {favorites.length === 0 ? (
            <EmptyState
              icon={<FaHeart className="text-5xl text-red-500" />}
              title={t('favorites.empty')}
              description={t('favorites.emptyDesc')}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {favorites.map((movie, index) => (
                <motion.div
                  key={movie.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="group relative"
                >
                  {/* Poster */}
                  <Link
                    to={`${ROUTES.MOVIE_DETAIL}/${movie.slug}`}
                    className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-gray-900"
                  >
                    <img
                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                      alt={movie.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={onImgError}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Year + rating badges */}
                    <div className="absolute left-2 top-2 flex gap-1.5">
                      {movie.year > 0 && (
                        <span className="rounded bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                          {movie.year}
                        </span>
                      )}
                    </div>

                    {/* Remove button — top-right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavorite(movie.slug);
                      }}
                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-red-600 group-hover:opacity-100"
                      aria-label={t('common.remove')}
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </Link>

                  {/* Title */}
                  <p className="mt-2 truncate text-sm font-medium text-gray-200">
                    {movie.name}
                  </p>

                  {/* ALWAYS VISIBLE watch button — below title */}
                  <Link
                    to={`${ROUTES.WATCH}/${movie.slug}`}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                  >
                    <FaPlay className="h-3 w-3" />
                    {t('hero.watchNow', 'Xem Ngay')}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
