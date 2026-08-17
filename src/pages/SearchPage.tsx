import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaTimes,
  FaHistory,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaSlidersH,
  FaGlobe,
  FaTags,
  FaCalendarAlt,
  FaSortAmountDown,
} from 'react-icons/fa';

import { MovieGrid } from '@/components/movie';
import { GridSkeleton, EmptyState } from '@/components/common';
import { DEBOUNCE_DELAY, SORT_OPTIONS, YEARS } from '@/constants';
import { useFilteredSearch, useGenres, useCountries, useDebounce } from '@/hooks';
import { useSearchStore } from '@/store';

/* ------------------------------------------------------------------ */
/* Animation variants                                                  */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

const INITIAL_VISIBLE = 24;
const LOAD_MORE_STEP = 24;

/* ------------------------------------------------------------------ */
/* Filter select component                                             */
/* ------------------------------------------------------------------ */

function FilterSelect({
  icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-800 text-red-400">
          {icon}
        </span>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2.5 pr-9 text-sm text-gray-200 outline-none transition-all hover:border-gray-600 focus:border-red-500/60 focus:bg-gray-900 focus:ring-2 focus:ring-red-500/20"
        >
          {children}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SearchPage                                                          */
/* ------------------------------------------------------------------ */

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const qParam = searchParams.get('q') ?? '';
  const countryParam = searchParams.get('country') ?? '';
  const categoryParam = searchParams.get('category') ?? '';
  const yearParam = searchParams.get('year') ?? '';
  const sortParam = searchParams.get('sort') ?? '';

  /* ---- Local state ---- */
  const [inputValue, setInputValue] = useState(qParam);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [country, setCountry] = useState(countryParam);
  const [category, setCategory] = useState(categoryParam);
  const [year, setYear] = useState(yearParam);
  const [sortField, setSortField] = useState(sortParam);
  const debouncedKeyword = useDebounce(inputValue, DEBOUNCE_DELAY);

  /* ---- Stores ---- */
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  /* ---- Reference data ---- */
  const { data: genresData } = useGenres();
  const { data: countriesData } = useCountries();
  const genres = Array.isArray(genresData) ? genresData : [];
  const countries = Array.isArray(countriesData) ? countriesData : [];

  /* ---- URL helpers ----
     All filter values + the keyword live in the URL (?q=&country=&category=
     &year=&sort=) so they survive refreshes, back/forward and navigation
     away & back — and, crucially, updating the keyword never wipes the
     filters (the old code called setSearchParams({ q }) which dropped every
     other param, so re-searching silently lost the active filters). */
  const updateUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const merged = {
        q: qParam,
        country,
        category,
        year,
        sort: sortField,
        ...patch,
      };
      const next = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => {
        if (v) next.set(k, v);
      });
      setSearchParams(next, { replace: true });
    },
    [qParam, country, category, year, sortField, setSearchParams],
  );

  /* Sync filter state whenever the URL changes from outside (back/forward,
     a link from a genre/country page, etc.). */
  useEffect(() => {
    setCountry(countryParam);
    setCategory(categoryParam);
    setYear(yearParam);
    setSortField(sortParam);
    if (countryParam || categoryParam || yearParam || sortParam) {
      setFiltersOpen(true);
    }
  }, [countryParam, categoryParam, yearParam, sortParam]);

  /* ---- URL → input sync ---- */
  useEffect(() => {
    setInputValue(qParam);
    setVisibleCount(INITIAL_VISIBLE);
  }, [qParam]);

  /* ---- Focus input on mount ---- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ---- Reset visible count when keyword or filters change ---- */
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedKeyword, country, category, year, sortField]);

  /* ---- Fetch results ---- */
  const { data, isLoading } = useFilteredSearch({
    keyword: debouncedKeyword,
    country: country || undefined,
    category: category || undefined,
    year: year || undefined,
    sort_field: sortField || undefined,
    sort_type: 'desc',
  });

  const movies = data?.items ?? [];
  const hasSearched = debouncedKeyword.trim().length > 0;
  const showNoResults = hasSearched && !isLoading && movies.length === 0;
  const showRecentSearches = !hasSearched && recentSearches.length > 0;
  const hasActiveFilters = !!(country || category || year || sortField);
  const activeFilterCount = [country, category, year, sortField].filter(Boolean).length;

  const visibleMovies = movies.slice(0, visibleCount);
  const hasMore = movies.length > visibleCount;

  /* Active filters as removable chips */
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (country) {
      const name = countries.find((c) => (c as { slug?: string }).slug === country)?.name;
      chips.push({ key: 'country', label: String(name ?? country), clear: () => setCountry('') });
    }
    if (category) {
      const name = genres.find((g) => (g as { slug?: string }).slug === category)?.name;
      chips.push({ key: 'category', label: String(name ?? category), clear: () => setCategory('') });
    }
    if (year) {
      chips.push({ key: 'year', label: year, clear: () => setYear('') });
    }
    if (sortField) {
      const label = SORT_OPTIONS.find((s) => s.value === sortField)?.label;
      chips.push({ key: 'sort', label: label ?? sortField, clear: () => setSortField('') });
    }
    return chips;
  }, [country, category, year, sortField, countries, genres]);

  /* ---- Handlers ---- */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      updateUrl({ q: val.trim() || null });
    },
    [updateUrl],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        addRecentSearch(trimmed);
      }
      inputRef.current?.blur();
    },
    [inputValue, addRecentSearch],
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    updateUrl({ q: null });
    inputRef.current?.focus();
  }, [updateUrl]);

  const handleRecentClick = useCallback(
    (term: string) => {
      setInputValue(term);
      updateUrl({ q: term });
      addRecentSearch(term);
    },
    [updateUrl, addRecentSearch],
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + LOAD_MORE_STEP);
  }, []);

  const handleResetFilters = useCallback(() => {
    setCountry('');
    setCategory('');
    setYear('');
    setSortField('');
  }, []);

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const patch: Record<string, string | null> = { [key]: value || null };
      if (key === 'country') setCountry(value);
      if (key === 'category') setCategory(value);
      if (key === 'year') setYear(value);
      if (key === 'sort') setSortField(value);
      updateUrl(patch);
    },
    [updateUrl],
  );

  return (
    <>
      <Helmet>
        <title>{t('seo.searchTitle')}</title>
        <meta name="description" content="Tìm kiếm phim tại Không Gian Phim — tìm phim lẻ, phim bộ, phim chiếu rạp theo tên." />
        <meta property="og:title" content={t('seo.searchTitle')} />
        <meta property="og:url" content="https://khonggianphim.online/tim-kiem" />
        <link rel="canonical" href="https://khonggianphim.online/tim-kiem" />
      </Helmet>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gray-950 text-white"
      >
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          {/* ---- Search header (centered) ---- */}
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-600/30">
                <FaSearch className="h-4 w-4 text-white" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">{t('seo.searchTitle')}</h1>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="group relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={t('search.placeholder')}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/80 py-3 pl-11 pr-11 text-base text-white placeholder-gray-500 shadow-lg shadow-black/20 outline-none backdrop-blur-sm transition-all focus:border-red-500/60 focus:ring-4 focus:ring-red-500/15"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition-colors hover:text-white"
                    aria-label={t('common.remove')}
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Filter toggle */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              >
                <FaSlidersH className="h-3 w-3 text-red-400" />
                {t('filter.title', 'Bộ lọc')}
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
                {filtersOpen ? (
                  <FaChevronUp className="h-2.5 w-2.5" />
                ) : (
                  <FaChevronDown className="h-2.5 w-2.5" />
                )}
              </button>
            </div>
          </div>

          {/* ---- Filter panel (collapsible) ---- */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5 backdrop-blur-sm">
                  <div className="flex flex-wrap gap-4">
                    <FilterSelect
                      icon={<FaGlobe className="h-3 w-3" />}
                      label={t('filter.country')}
                      value={country}
                      onChange={(v) => applyFilter('country', v)}
                    >
                      <option value="">{t('filter.allCountries')}</option>
                      {(Array.isArray(countries) ? countries : []).map((c: any) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      icon={<FaTags className="h-3 w-3" />}
                      label={t('filter.genre')}
                      value={category}
                      onChange={(v) => applyFilter('category', v)}
                    >
                      <option value="">{t('filter.allGenres')}</option>
                      {(Array.isArray(genres) ? genres : []).map((g: any) => (
                        <option key={g.slug} value={g.slug}>
                          {g.name}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      icon={<FaCalendarAlt className="h-3 w-3" />}
                      label={t('filter.year')}
                      value={year}
                      onChange={(v) => applyFilter('year', v)}
                    >
                      <option value="">{t('filter.allYears')}</option>
                      {YEARS.map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      icon={<FaSortAmountDown className="h-3 w-3" />}
                      label={t('filter.sortBy')}
                      value={sortField}
                      onChange={(v) => applyFilter('sort', v)}
                    >
                      <option value="">{t('filter.defaultSort')}</option>
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </FilterSelect>
                  </div>

                  {activeFilterChips.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-800 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {activeFilterChips.map((chip) => (
                          <span
                            key={chip.key}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-600/30 bg-red-600/15 px-2.5 py-1 text-xs text-red-300"
                          >
                            {chip.label}
                            <button
                              type="button"
                              onClick={chip.clear}
                              className="text-red-400 transition-colors hover:text-white"
                              aria-label={`${t('common.remove')} ${chip.label}`}
                            >
                              <FaTimes className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs font-medium text-gray-400 transition-colors hover:text-red-400"
                      >
                        {t('filter.reset')}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Recent searches ---- */}
          <AnimatePresence>
            {showRecentSearches && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-auto mt-8 max-w-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    <FaHistory className="h-3.5 w-3.5" />
                    {t('search.recentSearches')}
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-400"
                  >
                    <FaTrash className="h-3 w-3" />
                    {t('search.clearRecent')}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {recentSearches.map((term) => (
                      <motion.div
                        key={term}
                        variants={chipVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
                      >
                        <button
                          onClick={() => handleRecentClick(term)}
                          className="transition-colors hover:text-white"
                        >
                          {term}
                        </button>
                        <button
                          onClick={() => removeRecentSearch(term)}
                          className="rounded-full p-0.5 text-gray-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          aria-label={`${t('common.remove')} ${term}`}
                        >
                          <FaTimes className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Results ---- */}
          <div className="mt-8">
            {hasSearched && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-200">
                  {t('search.results')}
                </h2>
                {movies.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {visibleMovies.length} / {movies.length} {t('common.results')}
                  </span>
                )}
              </div>
            )}

            {isLoading && hasSearched && <GridSkeleton />}

            {showNoResults && (
              <EmptyState
                icon={<FaSearch />}
                title={t('search.noResults')}
                description={
                  hasActiveFilters
                    ? `"${debouncedKeyword}" — thử bỏ bớt bộ lọc`
                    : `"${debouncedKeyword}"`
                }
              />
            )}

            {hasSearched && !isLoading && movies.length > 0 && (
              <>
                <MovieGrid movies={visibleMovies} />

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-red-500/50 hover:bg-gray-800 hover:text-white"
                    >
                      <FaChevronDown className="h-3 w-3" />
                      {t('common.showMore', 'Xem thêm')}
                      <span className="text-xs text-gray-500">
                        ({movies.length - visibleCount} phim)
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}