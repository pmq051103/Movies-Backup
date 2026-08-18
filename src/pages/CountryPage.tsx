import { useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaGlobeAmericas, FaGlobeAsia, FaGlobeEurope } from 'react-icons/fa';

import { MovieGrid } from '@/components/movie';
import { Pagination, GridSkeleton } from '@/components/common';
import {
  useCountries,
  useMoviesInCountry,
  useMoviesBySlug,
} from '@/hooks';
import { ROUTES } from '@/constants';

const GRADIENT_PALETTES = [
  'from-blue-700 to-red-700',
  'from-red-600 to-yellow-600',
  'from-green-700 to-yellow-500',
  'from-sky-600 to-white/30',
  'from-rose-700 to-slate-800',
  'from-indigo-600 to-rose-600',
  'from-emerald-600 to-amber-600',
  'from-orange-600 to-green-700',
  'from-violet-700 to-amber-500',
  'from-cyan-600 to-red-600',
  'from-teal-600 to-blue-700',
  'from-fuchsia-600 to-sky-600',
  'from-amber-600 to-indigo-700',
  'from-pink-600 to-emerald-600',
  'from-lime-600 to-violet-700',
  'from-red-700 to-blue-600',
];

const GLOBE_ICONS = [FaGlobeAmericas, FaGlobeAsia, FaGlobeEurope];

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
/* Country list view                                                   */
/* ------------------------------------------------------------------ */

function CountryListView() {
  const { t } = useTranslation();
  const { data: countries = [], isLoading } = useCountries();

  if (isLoading) {
    return (
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('nav.countries')}</h1>
        <GridSkeleton count={16} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('nav.countries')}</h1>

      {countries.length === 0 ? (
        <p className="py-20 text-center text-gray-400">{t('common.noData')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {countries.map((country, index) => {
            const gradient = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
            const GlobeIcon = GLOBE_ICONS[index % GLOBE_ICONS.length];

            return (
              <motion.div
                key={country._id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={`${ROUTES.COUNTRIES}/${country.slug}`}
                  className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                >
                  <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/5" />
                  <GlobeIcon className="relative mb-3 h-8 w-8 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative text-center text-sm font-semibold text-white sm:text-base">
                    {country.name}
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
/* Country detail view (movies by country)                             */
/* ------------------------------------------------------------------ */

type CountryTypeTab = 'all' | 'single' | 'series';

const COUNTRY_TYPE_TABS: { value: CountryTypeTab; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.allTypes' },
  { value: 'single', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.tvShows' },
];

function CountryDetailView({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const { data: countries = [] } = useCountries();

  const activeType: CountryTypeTab =
    (searchParams.get('type') as CountryTypeTab) || 'all';

  // phimapi's /v1/api/quoc-gia/[slug]?type= ignores the type param. Use
  // /v1/api/danh-sach/phim-le|phim-bo?country=[slug] instead when the
  // user narrows to Phim Lẻ or Phim Bộ — that endpoint DOES filter.
  const allQuery = useMoviesInCountry(activeType === 'all' ? slug : undefined, {
    page,
  });
  const typedQuery = useMoviesBySlug(
    activeType === 'all'
      ? undefined
      : `phim-${activeType === 'single' ? 'le' : 'bo'}`,
    { page, country: slug },
  );

  const { data, isLoading } =
    activeType === 'all' ? allQuery : typedQuery;

  const countryName = useMemo(() => {
    const found = countries.find((c) => c.slug === slug);
    return found?.name ?? slug;
  }, [countries, slug]);

  const displayMovies = data?.items ?? [];

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTypeChange = useCallback(
    (v: CountryTypeTab) => {
      const next = new URLSearchParams(searchParams);
      if (v === 'all') next.delete('type');
      else next.set('type', v);
      setSearchParams(next, { replace: true });
      setPage(1);
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>{`${countryName} - ${t('seo.countriesTitle')}`}</title>
        <meta name="description" content={`Phim ${countryName} — xem phim online miễn phí tại Không Gian Phim.`} />
        <meta property="og:title" content={`${countryName} - ${t('seo.countriesTitle')}`} />
        <meta property="og:url" content={`https://khonggianphim.online/quoc-gia/${slug}`} />
        <link rel="canonical" href={`https://khonggianphim.online/quoc-gia/${slug}`} />
      </Helmet>

      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{countryName}</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {COUNTRY_TYPE_TABS.map((tab) => (
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
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <MovieGrid movies={displayMovies} />
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
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

export default function CountryPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug?: string }>();

  return (
    <>
      {!slug && (
        <Helmet>
          <title>{t('seo.countriesTitle')}</title>
          <meta name="description" content="Danh sách phim theo quốc gia tại Không Gian Phim — Hàn Quốc, Trung Quốc, Mỹ, Nhật Bản và nhiều hơn nữa." />
          <meta property="og:title" content={t('seo.countriesTitle')} />
          <meta property="og:url" content="https://khonggianphim.online/quoc-gia" />
          <link rel="canonical" href="https://khonggianphim.online/quoc-gia" />
        </Helmet>
      )}

      <motion.div
        className="min-h-screen bg-gray-950 text-white"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {slug ? <CountryDetailView slug={slug} /> : <CountryListView />}
      </motion.div>
    </>
  );
}
