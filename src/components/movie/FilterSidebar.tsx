import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaUndo, FaSearch, FaChevronDown, FaCheck } from 'react-icons/fa';

import { YEARS } from '@/constants';
import { useGenres, useCountries } from '@/hooks';
import type { FilterState, Genre, Country } from '@/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'modified.time', label: 'filter.sortNewest' },
  { value: 'year', label: 'filter.sortYear' },
  { value: 'tmdb.vote_average', label: 'filter.sortRating' },
  { value: '_id', label: 'filter.sortDefault' },
] as const;

const SORT_TYPES = [
  { value: 'desc', label: 'filter.descending' },
  { value: 'asc', label: 'filter.ascending' },
] as const;

const defaultFilters: FilterState = {
  genre: undefined,
  country: undefined,
  year: undefined,
  quality: undefined,
  language: undefined,
  status: undefined,
  type: undefined,
  sortField: undefined,
  sortType: undefined,
  page: 1,
};

/** Drop diacritics for tolerant search matching ("han quoc" → "Hàn Quốc"). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/* ------------------------------------------------------------------ */
/* Reusable searchable dropdown                                        */
/* ------------------------------------------------------------------ */

interface SearchableOption {
  _id: string | number;
  name: string;
  slug: string;
}

interface SearchableDropdownProps<T extends SearchableOption> {
  label: string;
  placeholder: string;
  allLabel: string;
  value?: string;
  items: T[];
  loading?: boolean;
  onChange: (slug: string | undefined) => void;
}

function SearchableDropdown<T extends SearchableOption>({
  label,
  placeholder,
  allLabel,
  value,
  items,
  loading,
  onChange,
}: SearchableDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = useMemo(
    () => items.find((i) => i.slug === value),
    [items, value],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (i) => normalize(i.name).includes(q) || normalize(i.slug).includes(q),
    );
  }, [items, query]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-400">{label}</label>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg border bg-[#18181b] px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:border-[#ffd166]/50 focus:border-[#ffd166] focus:outline-none focus:ring-1 focus:ring-[#ffd166] disabled:opacity-50 ${
          selected ? 'border-[#ffd166]/40' : 'border-white/10'
        }`}
      >
        <span className={`truncate ${selected ? 'text-[#ffd166]' : ''}`}>
          {selected?.name ?? allLabel}
        </span>
        <FaChevronDown
          className={`ml-2 h-2.5 w-2.5 shrink-0 text-gray-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-white/10 bg-[#0f111a]/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 p-2">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-[#ffd166]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
                setQuery('');
              }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/5 ${
                !value ? 'text-[#ffd166]' : 'text-gray-300'
              }`}
            >
              {allLabel}
              {!value && <FaCheck className="h-3 w-3" />}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-gray-500">
                Không có kết quả
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    onChange(item.slug);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/5 ${
                    value === item.slug ? 'text-[#ffd166]' : 'text-gray-300'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {value === item.slug && <FaCheck className="h-3 w-3 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FilterSidebar                                                       */
/* ------------------------------------------------------------------ */

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  className = '',
}) => {
  const { t } = useTranslation();
  const { data: genres = [], isLoading: genresLoading } = useGenres();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();

  const [localFilters, setLocalFilters] = useState<FilterState>({ ...filters });

  // Keep local state in sync when parent-provided filters change (URL sync).
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);

  const handleChange = useCallback(
    (field: keyof FilterState, value: string | number | undefined) => {
      setLocalFilters((prev) => ({ ...prev, [field]: value || undefined }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    onFilterChange({ ...localFilters, page: 1 });
  }, [localFilters, onFilterChange]);

  const handleReset = useCallback(() => {
    setLocalFilters({ ...defaultFilters });
    onFilterChange({ ...defaultFilters });
  }, [onFilterChange]);

  const selectClasses =
    'w-full rounded-lg border bg-[#18181b] px-3 py-2 text-sm text-gray-200 outline-none transition-colors focus:border-[#ffd166] focus:ring-1 focus:ring-[#ffd166]';

  return (
    <div
      className={`rounded-[.75rem] border border-white/10 bg-[#18181b]/60 p-4 backdrop-blur-sm ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <FaFilter className="h-4 w-4 text-[#ffd166]" />
        <h3 className="text-lg font-semibold text-white">{t('filter.title')}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
        {/* Genre — searchable dropdown */}
        <SearchableDropdown<Genre>
          label={t('filter.genre')}
          allLabel={t('filter.allGenres')}
          placeholder={t('search.searchGenre', 'Tìm thể loại...')}
          value={localFilters.genre}
          items={genres}
          loading={genresLoading}
          onChange={(v) => handleChange('genre', v)}
        />

        {/* Country — searchable dropdown */}
        <SearchableDropdown<Country>
          label={t('filter.country')}
          allLabel={t('filter.allCountries')}
          placeholder={t('search.searchCountry', 'Tìm quốc gia...')}
          value={localFilters.country}
          items={countries}
          loading={countriesLoading}
          onChange={(v) => handleChange('country', v)}
        />

        {/* Year */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            {t('filter.year')}
          </label>
          <select
            value={localFilters.year ?? ''}
            onChange={(e) => handleChange('year', e.target.value)}
            className={`${selectClasses} border-white/10`}
          >
            <option value="">{t('filter.allYears')}</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Sort field */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            {t('filter.sortBy')}
          </label>
          <select
            value={localFilters.sortField ?? ''}
            onChange={(e) => handleChange('sortField', e.target.value)}
            className={`${selectClasses} border-white/10`}
          >
            <option value="">{t('filter.defaultSort')}</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort direction */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            {t('filter.sortDirection')}
          </label>
          <select
            value={localFilters.sortType ?? 'desc'}
            onChange={(e) =>
              handleChange('sortType', e.target.value as 'asc' | 'desc')
            }
            className={`${selectClasses} border-white/10`}
          >
            {SORT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-[.4rem] bg-[#ffd166] px-4 py-2 text-sm font-semibold text-[#0f111a] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]"
        >
          {t('filter.apply')}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 rounded-[.4rem] border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          <FaUndo className="h-3 w-3" />
          {t('filter.reset')}
        </button>
      </div>
    </div>
  );
};

export default memo(FilterSidebar);
