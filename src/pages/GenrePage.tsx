import { useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link, Navigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaFilm, FaTheaterMasks, FaSearch, FaTimes } from 'react-icons/fa';

import { MovieGrid, SpotlightGrid, CategoryBanner } from '@/components/movie';
import { Pagination, GridSkeleton } from '@/components/common';
import {
  useGenres,
  useMoviesInGenre,
  useMoviesBySlug,
  useContextualSearch,
} from '@/hooks';
import { ROUTES } from '@/constants';

const GRADIENT_PALETTES = [
  'from-rose-600 to-pink-800',
  'from-violet-600 to-purple-800',
  'from-blue-600 to-indigo-800',
  'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800',
  'from-cyan-600 to-sky-800',
  'from-fuchsia-600 to-pink-900',
  'from-lime-600 to-green-800',
  'from-red-600 to-rose-900',
  'from-indigo-600 to-blue-900',
  'from-teal-600 to-cyan-900',
  'from-orange-600 to-red-800',
  'from-purple-600 to-violet-900',
  'from-sky-600 to-blue-800',
  'from-pink-600 to-fuchsia-900',
  'from-green-600 to-emerald-900',
];

const GENRE_ICONS = [
  FaFilm,
  FaTheaterMasks,
];

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
};

/* ------------------------------------------------------------------ */
/* Genre list view                                                     */
/* ------------------------------------------------------------------ */

function GenreListView() {
  const { t } = useTranslation();
  const { data: genres = [], isLoading } = useGenres();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('nav.genres')}</h1>
        <GridSkeleton count={16} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('nav.genres')}</h1>

      {genres.length === 0 ? (
        <p className="py-20 text-center text-gray-400">{t('common.noData')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {genres.map((genre, index) => {
            const gradient = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
            const IconComponent = GENRE_ICONS[index % GENRE_ICONS.length];

            return (
              <motion.div
                key={genre._id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={`${ROUTES.GENRES}/${genre.slug}`}
                  className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                >
                  <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:bg-black/0" />
                  <IconComponent className="relative mb-3 h-8 w-8 text-white/80 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative text-center text-sm font-semibold text-white sm:text-base">
                    {genre.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Genre detail view (movies by genre)                                 */
/* ------------------------------------------------------------------ */

type MovieTypeTab = 'all' | 'single' | 'series';

const TYPE_TABS: { value: MovieTypeTab; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.allTypes' },
  { value: 'single', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.tvShows' },
];

function GenreDetailView({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [inlineSearch, setInlineSearch] = useState('');
  const { data: genres = [] } = useGenres();

  const activeType: MovieTypeTab =
    (searchParams.get('type') as MovieTypeTab) || 'all';

  // phimapi's /v1/api/the-loai/[slug]?type= IGNORES the type param. To
  // actually honour "Phim Lẻ" / "Phim Bộ" we must hit the flipped
  // endpoint /v1/api/danh-sach/[phim-le|phim-bo]?category=[genre],
  // which DOES respect the category param.
  const allQuery = useMoviesInGenre(activeType === 'all' ? slug : undefined, {
    page,
  });
  const typedQuery = useMoviesBySlug(
    activeType === 'all' ? undefined : `phim-${activeType === 'single' ? 'le' : 'bo'}`,
    { page, category: slug },
  );

  const { data, isLoading } =
    activeType === 'all' ? allQuery : typedQuery;

  // Contextual inline search: hits phimapi's search endpoint then
  // client-filters by the current genre (and, if applicable, the type
  // tab). Guarantees users can find any matching title, not just those
  // in the currently-loaded page.
  const searchCtx = useMemo(
    () => ({
      categorySlug: slug,
      type:
        activeType === 'single'
          ? 'single'
          : activeType === 'series'
            ? 'series'
            : undefined,
    }),
    [slug, activeType],
  );
  const {
    active: isSearching,
    isLoading: isSearchLoading,
    results: searchResults,
  } = useContextualSearch(inlineSearch, searchCtx);

  const genreName = useMemo(() => {
    const found = genres.find((g) => g.slug === slug);
    return found?.name ?? slug;
  }, [genres, slug]);

  // Display list: search mode → results from contextual search;
  // browsing mode → current page of the paginated listing.
  const displayMovies = isSearching ? searchResults : (data?.items ?? []);
  const displayLoading = isSearching ? isSearchLoading : isLoading;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTypeChange = useCallback(
    (v: MovieTypeTab) => {
      const next = new URLSearchParams(searchParams);
      if (v === 'all') next.delete('type');
      else next.set('type', v);
      setSearchParams(next, { replace: true });
      setPage(1);
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>{`${genreName} - ${t('seo.genresTitle')}`}</title>
        <meta name="description" content={`Phim thể loại ${genreName} — xem phim online miễn phí tại Không Gian Phim.`} />
        <meta property="og:title" content={`${genreName} - ${t('seo.genresTitle')}`} />
        <meta property="og:url" content={`https://khonggianphim.online/the-loai/${slug}`} />
        <link rel="canonical" href={`https://khonggianphim.online/the-loai/${slug}`} />
      </Helmet>

      <CategoryBanner
        eyebrow={t('nav.genres')}
        title={genreName}
        totalItems={data?.pagination?.totalItems}
        backdropUrl={displayMovies[0]?.thumb_url ?? displayMovies[0]?.poster_url}
        icon={FaTheaterMasks}
      />

      {/* Type tabs + inline search on the same row (stacks on mobile).
          Type tabs hidden for synthetic slugs (Hoạt Hình / TV Shows) where
          the "type" filter isn't meaningful — the whole list IS one type. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTypeChange(tab.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeType === tab.value
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Inline search — filters items in the current page client-side */}
        <div className="relative w-full sm:max-w-xs">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder={t(
              'filter.searchInResults',
              'Tìm trong danh sách...',
            )}
            className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-9 pr-9 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          {inlineSearch && (
            <button
              type="button"
              onClick={() => setInlineSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:text-white"
              aria-label={t('search.clear')}
            >
              <FaTimes className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {displayLoading ? (
        <GridSkeleton />
      ) : displayMovies.length === 0 && isSearching ? (
        <p className="py-16 text-center text-gray-500">
          {t('search.noResults')}
        </p>
      ) : (
        <>
          {!isSearching && page === 1 && displayMovies.length >= 5 && (
            <div className="mb-8">
              <SpotlightGrid
                title={genreName}
                movies={displayMovies.slice(0, 8)}
              />
            </div>
          )}
          <MovieGrid
            movies={
              !isSearching && page === 1 && displayMovies.length >= 5
                ? displayMovies.slice(5, 23)
                : displayMovies
            }
          />
        </>
      )}

      {!isSearching && data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                         */
/* ------------------------------------------------------------------ */

/** Genre slugs that must be blocked from ever rendering (adult content). */
const BLOCKED_GENRE_SLUGS = new Set(['phim-18', '18+', 'adult']);

export default function GenrePage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug?: string }>();

  // Anyone deep-linking to /the-loai/phim-18 gets bounced to the home page.
  if (slug && BLOCKED_GENRE_SLUGS.has(slug.toLowerCase())) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <>
      {!slug && (
        <Helmet>
          <title>{t('seo.genresTitle')}</title>
          <meta name="description" content="Danh sách thể loại phim tại Không Gian Phim — hành động, tình cảm, kinh dị, hoạt hình và nhiều hơn nữa." />
          <meta property="og:title" content={t('seo.genresTitle')} />
          <meta property="og:url" content="https://khonggianphim.online/the-loai" />
          <link rel="canonical" href="https://khonggianphim.online/the-loai" />
        </Helmet>
      )}

      <motion.div
        className="min-h-screen bg-gray-950 text-white"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {slug ? <GenreDetailView slug={slug} /> : <GenreListView />}
      </motion.div>
    </>
  );
}
