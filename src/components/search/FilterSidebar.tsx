import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaUndo } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { useGenres, useCountries } from '@/hooks/useMovies';
import { getYearRange } from '@/utils';
import { STATUS_OPTIONS } from '@/constants';
import type { FilterState } from '@/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

const TYPE_OPTIONS = [
  { label: 'filter.allTypes', value: '' },
  { label: 'filter.phimLe', value: 'single' },
  { label: 'filter.phimBo', value: 'series' },
  { label: 'filter.hoatHinh', value: 'hoathinh' },
  { label: 'filter.tvShows', value: 'tvshows' },
] as const;

const SORT_OPTIONS = [
  { label: 'filter.sortModified', value: 'modified.time' },
  { label: 'filter.sortYear', value: 'year' },
  { label: 'filter.sortId', value: '_id' },
] as const;

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const { data: genres } = useGenres();
  const { data: countries } = useCountries();
  const yearRange = getYearRange();

  const handleLocalChange = (key: keyof FilterState, value: string | number) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    const empty: FilterState = {};
    setLocalFilters(empty);
    onReset();
    setIsExpanded(false);
  };

  const selectClasses =
    'bg-gray-800 border border-gray-700 rounded-lg text-white p-2.5 w-full focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer';

  const labelClasses = 'block text-sm font-medium text-gray-300 mb-1.5';

  const filterContent = (
    <div className="space-y-4">
      {/* Genre */}
      <div>
        <label className={labelClasses}>{t('filter.genre')}</label>
        <select
          value={localFilters.genre ?? ''}
          onChange={(e) => handleLocalChange('genre', e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('filter.all')}</option>
          {(genres as unknown as Array<{ slug: string; name: string }>)?.map(
            (genre) => (
              <option key={genre.slug} value={genre.slug}>
                {genre.name}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Country */}
      <div>
        <label className={labelClasses}>{t('filter.country')}</label>
        <select
          value={localFilters.country ?? ''}
          onChange={(e) => handleLocalChange('country', e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('filter.all')}</option>
          {(countries as unknown as Array<{ slug: string; name: string }>)?.map(
            (country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Year */}
      <div>
        <label className={labelClasses}>{t('filter.year')}</label>
        <select
          value={localFilters.year ?? ''}
          onChange={(e) => handleLocalChange('year', e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('filter.all')}</option>
          {yearRange.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className={labelClasses}>{t('filter.type')}</label>
        <select
          value={(localFilters as FilterState & { type?: string }).type ?? ''}
          onChange={(e) => {
            setLocalFilters((prev) => ({
              ...prev,
              type: e.target.value,
            } as FilterState));
          }}
          className={selectClasses}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className={labelClasses}>{t('filter.status')}</label>
        <select
          value={localFilters.status ?? ''}
          onChange={(e) => handleLocalChange('status', e.target.value)}
          className={selectClasses}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className={labelClasses}>{t('filter.sort')}</label>
        <select
          value={localFilters.sortField ?? 'modified.time'}
          onChange={(e) => handleLocalChange('sortField', e.target.value)}
          className={selectClasses}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleApply}
          className="bg-red-600 hover:bg-red-700 w-full rounded-lg py-2.5 font-semibold text-white transition-colors"
        >
          {t('filter.apply')}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 w-full rounded-lg py-2.5 text-gray-300 transition-colors"
        >
          <FaUndo className="h-3 w-3" />
          <span>{t('filter.reset')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2.5 text-gray-300 transition-colors"
        >
          <FaFilter className="h-4 w-4" />
          <span className="text-sm font-medium">{t('filter.filters')}</span>
        </button>
      </div>

      {/* Mobile: collapsible panel */}
      <div className="lg:hidden">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 mb-6">
                {filterContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: always visible sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
            <FaFilter className="h-4 w-4 text-red-500" />
            {t('filter.filters')}
          </h3>
          {filterContent}
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
