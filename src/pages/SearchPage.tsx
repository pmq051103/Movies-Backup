import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FaArrowRight,
  FaCheck,
} from 'react-icons/fa';

import { MovieGrid } from '@/components/movie';
import { GridSkeleton, EmptyState, Pagination } from '@/components/common';
import { SORT_OPTIONS, YEARS } from '@/constants';
import { useFilteredSearch, useGenres, useCountries } from '@/hooks';
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

const PAGE_SIZE = 24;
// Reference site only shows the most recent handful of years as pills
// (plus a free-text field for anything older) instead of a 35-year list.
const RECENT_YEARS = YEARS.slice(0, 7);

const LANGUAGE_OPTIONS = [
  { label: 'Phụ đề', value: 'vietsub' },
  { label: 'Thuyết minh', value: 'thuyet-minh' },
  { label: 'Lồng tiếng', value: 'long-tieng' },
] as const;

const TYPE_OPTIONS = [
  { label: 'Phim lẻ', value: 'single' },
  { label: 'Phim bộ', value: 'series' },
] as const;

/* ------------------------------------------------------------------ */
/* Filter row — pill buttons on desktop; on mobile, a dropdown styled to */
/* match the site's dark/gold theme instead of the browser's native      */
/* <select> (which renders with the OS's own light picker UI and looks   */
/* completely out of place here).                                       */
/* ------------------------------------------------------------------ */

function MobileDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? 'Tất cả';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full flex-1 sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-full border bg-white/5 px-4 py-2 text-left text-sm transition-colors ${
          value ? 'border-[#ffd166]/40 text-[#ffd166]' : 'border-white/10 text-gray-200'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <FaChevronDown
          className={`ml-2 h-2.5 w-2.5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#14151d] py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
              !value ? 'text-[#ffd166]' : 'text-gray-300'
            }`}
          >
            Tất cả
            {!value && <FaCheck className="h-3 w-3" />}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                value === o.value ? 'text-[#ffd166]' : 'text-gray-300'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <FaCheck className="h-3 w-3 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
  extra,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  /** Extra content rendered below the row (e.g. Year's free-text input),
      inside the same bordered block instead of adding a nested one. */
  extra?: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2.5 sm:items-center">
        <span className="w-28 shrink-0 pt-0.5 text-sm text-gray-400">{label}:</span>

        <MobileDropdown value={value} options={options} onChange={onChange} />

        {/* Desktop — pill row */}
        <div className="hidden flex-1 flex-wrap items-center gap-1.5 sm:flex">
          <Pill active={!value} onClick={() => onChange('')}>
            Tất cả
          </Pill>
          {options.map((o) => (
            <Pill key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </div>
      {extra && <div className="mt-2.5 sm:ml-28">{extra}</div>}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-[#ffd166] text-[#ffd166]'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* SearchPage                                                          */
/* ------------------------------------------------------------------ */

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const qParam = (searchParams.get('q') ?? '').trim();
  const countryParam = searchParams.get('country') ?? '';
  const categoryParam = searchParams.get('category') ?? '';
  const yearParam = searchParams.get('year') ?? '';
  const typeParam = searchParams.get('type') ?? '';
  const langParam = searchParams.get('lang') ?? '';
  const sortParam = searchParams.get('sort') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  /* ---- Local state ----
     Filters live in the URL (?q=&country=&category=&year=&type=&lang=
     &sort=&page=) so they survive refreshes, back/forward and navigation
     away & back. There is no search input on this page anymore — the
     header's own search box is the only way to change the keyword (it
     already navigates here with `?q=`), matching the reference layout. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [country, setCountry] = useState(countryParam);
  const [category, setCategory] = useState(categoryParam);
  const [year, setYear] = useState(yearParam);
  const [yearInput, setYearInput] = useState('');
  const [type, setType] = useState(typeParam);
  const [lang, setLang] = useState(langParam);
  const [sortField, setSortField] = useState(sortParam);

  /* ---- Stores ---- */
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useSearchStore();

  /* ---- Reference data ---- */
  const { data: genresData } = useGenres();
  const { data: countriesData } = useCountries();
  const genres = Array.isArray(genresData) ? genresData : [];
  const countries = Array.isArray(countriesData) ? countriesData : [];

  const updateUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const merged = {
        q: qParam,
        country,
        category,
        year,
        type,
        lang,
        sort: sortField,
        page: patch.page !== undefined ? patch.page : null, // reset page unless explicitly kept
        ...patch,
      };
      const next = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => {
        if (v) next.set(k, v);
      });
      setSearchParams(next, { replace: true });
    },
    [qParam, country, category, year, type, lang, sortField, setSearchParams],
  );

  /* Sync filter state whenever the URL changes from outside (back/forward,
     a link from a genre/country page, etc.). */
  useEffect(() => {
    setCountry(countryParam);
    setCategory(categoryParam);
    setYear(yearParam);
    setType(typeParam);
    setLang(langParam);
    setSortField(sortParam);
  }, [countryParam, categoryParam, yearParam, typeParam, langParam, sortParam]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [qParam, countryParam, categoryParam, yearParam, typeParam, langParam, sortParam, pageParam]);

  /* ---- Fetch results ---- */
  const { data, isLoading } = useFilteredSearch({
    keyword: qParam,
    country: country || undefined,
    category: category || undefined,
    year: year || undefined,
    type: type || undefined,
    sort_lang: lang || undefined,
    sort_field: sortField || undefined,
    sort_type: 'desc',
  });

  const rawMovies = data?.items ?? [];

  // Client-side safety net for type/language — guarantees correct
  // filtering even if the upstream search endpoint ignores those params
  // (its documented support is for country/category/year/sort only).
  const movies = useMemo(() => {
    let list = rawMovies;
    if (type) list = list.filter((m) => m.type === type);
    if (lang) {
      list = list.filter((m) => {
        const raw = (m.lang || '').toLowerCase();
        if (lang === 'vietsub') return /vietsub|phụ đề|phu de/.test(raw);
        if (lang === 'thuyet-minh') return /thuyết|thuyet/.test(raw);
        if (lang === 'long-tieng') return /lồng|long tieng/.test(raw);
        return true;
      });
    }
    return list;
  }, [rawMovies, type, lang]);

  const hasSearched = qParam.length > 0;
  const showNoResults = hasSearched && !isLoading && movies.length === 0;
  const showRecentSearches = !hasSearched && recentSearches.length > 0;
  const activeFilterCount = [country, category, year, type, lang, sortField].filter(
    Boolean,
  ).length;

  const totalPages = Math.max(1, Math.ceil(movies.length / PAGE_SIZE));
  const page = Math.min(pageParam, totalPages);
  const pageMovies = movies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Active filters as removable chips */
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (country) {
      const name = countries.find((c) => (c as { slug?: string }).slug === country)?.name;
      chips.push({ key: 'country', label: String(name ?? country), clear: () => applyFilter('country', '') });
    }
    if (category) {
      const name = genres.find((g) => (g as { slug?: string }).slug === category)?.name;
      chips.push({ key: 'category', label: String(name ?? category), clear: () => applyFilter('category', '') });
    }
    if (year) {
      chips.push({ key: 'year', label: year, clear: () => applyFilter('year', '') });
    }
    if (type) {
      const label = TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
      chips.push({ key: 'type', label, clear: () => applyFilter('type', '') });
    }
    if (lang) {
      const label = LANGUAGE_OPTIONS.find((o) => o.value === lang)?.label ?? lang;
      chips.push({ key: 'lang', label, clear: () => applyFilter('lang', '') });
    }
    if (sortField) {
      const label = SORT_OPTIONS.find((s) => s.value === sortField)?.label;
      chips.push({ key: 'sort', label: label ?? sortField, clear: () => applyFilter('sort', '') });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category, year, type, lang, sortField, countries, genres]);

  /* ---- Handlers ---- */
  const handleRecentClick = useCallback(
    (term: string) => {
      updateUrl({ q: term });
    },
    [updateUrl],
  );

  const handleResetFilters = useCallback(() => {
    setCountry('');
    setCategory('');
    setYear('');
    setYearInput('');
    setType('');
    setLang('');
    setSortField('');
    updateUrl({ country: null, category: null, year: null, type: null, lang: null, sort: null });
  }, [updateUrl]);

  const applyFilter = useCallback(
    (key: 'country' | 'category' | 'year' | 'type' | 'lang' | 'sort', value: string) => {
      const patch: Record<string, string | null> = { [key]: value || null };
      if (key === 'country') setCountry(value);
      if (key === 'category') setCategory(value);
      if (key === 'year') setYear(value);
      if (key === 'type') setType(value);
      if (key === 'lang') setLang(value);
      if (key === 'sort') setSortField(value);
      updateUrl(patch);
    },
    [updateUrl],
  );

  const handleYearInputCommit = useCallback(() => {
    const trimmed = yearInput.trim();
    if (trimmed) applyFilter('year', trimmed);
  }, [yearInput, applyFilter]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      updateUrl({ page: String(nextPage) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* ---- Heading ---- */}
          {hasSearched ? (
            <h1 className="text-2xl font-bold tracking-tight">
              {t('search.resultsFor', { keyword: qParam })}
            </h1>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{t('seo.searchTitle')}</h1>
          )}

          {/* Filter toggle — collapsed by default, just the label + icon,
              no search box on this page (use the header's search instead). */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#ffd166] transition-colors hover:text-[#ffe099]"
          >
            <FaSlidersH className="h-3.5 w-3.5" />
            {t('filter.title', 'Bộ lọc')}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd166] text-[10px] font-bold text-[#0f111a]">
                {activeFilterCount}
              </span>
            )}
            {filtersOpen ? (
              <FaChevronUp className="h-2.5 w-2.5" />
            ) : (
              <FaChevronDown className="h-2.5 w-2.5" />
            )}
          </button>

          {/* ---- Filter panel (collapsible, pill-button rows) ---- */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5 backdrop-blur-sm">
                  <FilterRow
                    label={t('filter.country')}
                    value={country}
                    options={countries.map((c: any) => ({ label: c.name, value: c.slug }))}
                    onChange={(v) => applyFilter('country', v)}
                  />

                  <FilterRow
                    label={t('filter.type')}
                    value={type}
                    options={TYPE_OPTIONS as unknown as { label: string; value: string }[]}
                    onChange={(v) => applyFilter('type', v)}
                  />

                  <FilterRow
                    label={t('filter.genre')}
                    value={category}
                    options={genres.map((g: any) => ({ label: g.name, value: g.slug }))}
                    onChange={(v) => applyFilter('category', v)}
                  />

                  <FilterRow
                    label={t('filter.language')}
                    value={lang}
                    options={LANGUAGE_OPTIONS as unknown as { label: string; value: string }[]}
                    onChange={(v) => applyFilter('lang', v)}
                  />

                  <FilterRow
                    label={t('filter.year')}
                    value={year}
                    options={RECENT_YEARS.map((y) => ({ label: String(y), value: String(y) }))}
                    onChange={(v) => applyFilter('year', v)}
                    extra={
                      // Free-text year — for anything outside the recent
                      // list above (both the dropdown and the pill row).
                      <div className="relative w-full sm:w-40">
                        <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={yearInput}
                          onChange={(e) => setYearInput(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={handleYearInputCommit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleYearInputCommit();
                            }
                          }}
                          placeholder="Nhập năm khác"
                          className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-gray-300 outline-none placeholder:text-gray-500 focus:border-[#ffd166]/50"
                        />
                      </div>
                    }
                  />

                  <FilterRow
                    label={t('filter.sortBy')}
                    value={sortField}
                    options={SORT_OPTIONS as unknown as { label: string; value: string }[]}
                    onChange={(v) => applyFilter('sort', v)}
                  />

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#ffd166] px-6 py-2.5 text-sm font-bold text-[#0f111a] transition-opacity hover:opacity-90"
                    >
                      {t('common.showMore', 'Lọc kết quả')}
                      <FaArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
                    >
                      Đóng
                    </button>
                    {activeFilterChips.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="ml-auto text-xs font-medium text-gray-400 transition-colors hover:text-[#ffd166]"
                      >
                        {t('filter.reset')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips (visible even with the panel collapsed) */}
          {activeFilterChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd166]/30 bg-[#ffd166]/10 px-2.5 py-1 text-xs text-[#ffd166]"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.clear}
                    className="text-[#ffd166]/70 transition-colors hover:text-white"
                    aria-label={`${t('common.remove')} ${chip.label}`}
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* ---- Recent searches (only when there's no active query) ---- */}
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
                <h2 className="text-lg font-semibold text-gray-200">{t('search.results')}</h2>
                {movies.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {movies.length} {t('common.results')}
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
                  activeFilterCount > 0
                    ? `"${qParam}" — thử bỏ bớt bộ lọc`
                    : `"${qParam}"`
                }
              />
            )}

            {hasSearched && !isLoading && movies.length > 0 && (
              <>
                <MovieGrid movies={pageMovies} />
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
