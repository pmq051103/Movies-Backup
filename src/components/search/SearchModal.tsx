import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaSearch, FaHistory, FaTrash, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/hooks';
import { useSearchMovies } from '@/hooks/useMovies';
import { useSearchStore } from '@/store/useSearchStore';
import { getMoviePoster } from '@/utils';
import { ROUTES } from '@/constants';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useSearchStore();

  const { data, isLoading } = useSearchMovies({
    keyword: debouncedQuery,
    limit: 10,
  });

  const items = data?.items ?? [];

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use a slight delay so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Autofocus input when dropdown opens; reset query on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    setQuery('');
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        addRecentSearch(trimmed);
        navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
        onClose();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [query, addRecentSearch, navigate, onClose],
  );

  const handleViewAll = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      addRecentSearch(trimmed);
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
      onClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [query, addRecentSearch, navigate, onClose]);

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleResultClick = useCallback(
    (movie: { slug: string; _source?: string }) => {
      const url = movie._source && movie._source !== 'phimapi'
        ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${movie._source}`
        : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;
      navigate(url);
      window.scrollTo({ top: 0 });
      onClose();
    },
    [navigate, onClose],
  );

  const showRecentSearches = query.length === 0 && recentSearches.length > 0;
  const showResults = debouncedQuery.length >= 2;
  const showNoResults = showResults && !isLoading && items.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="always-dark fixed left-2 right-2 top-[4.5rem] z-[60] mx-auto max-w-[480px] rounded-xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/40 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mx-0 sm:mt-2 sm:w-[420px]"
        >
          {/* Search input */}
          <form onSubmit={handleSubmit} className="border-b border-gray-800 p-3">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-9 text-base text-white outline-none placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors sm:text-sm"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={t('search.clear')}
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Dropdown body */}
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {/* Recent searches */}
            {showRecentSearches && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <FaHistory className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {t('search.recentSearches')}
                    </span>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <FaTrash className="h-2.5 w-2.5" />
                    <span>{t('search.clearAll')}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="group flex items-center gap-1.5 rounded-md bg-gray-800 px-2.5 py-1.5 transition-colors hover:bg-gray-750"
                    >
                      <button
                        onClick={() => handleRecentClick(term)}
                        className="text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(term)}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={t('search.removeRecent', { term })}
                      >
                        <FaTimes className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {showResults && isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-12 w-9 flex-shrink-0 rounded bg-gray-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-gray-800" />
                      <div className="h-2.5 w-1/3 rounded bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {showNoResults && (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <FaSearch className="h-6 w-6 mb-2 opacity-30" />
                <p className="text-sm">{t('search.noResults')}</p>
                <p className="text-xs mt-0.5 text-gray-600">
                  {t('search.tryDifferent')}
                </p>
              </div>
            )}

            {/* Results list */}
            {showResults && !isLoading && items.length > 0 && (
              <div className="py-1">
                {items.slice(0, 10).map((movie) => {
                  const posterSrc = getMoviePoster(movie.poster_url, movie.thumb_url);
                  return (
                    <button
                      key={movie._id}
                      type="button"
                      onClick={() => handleResultClick(movie as any)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-800/70"
                    >
                      {/* Poster thumbnail */}
                      <div className="h-12 w-[34px] flex-shrink-0 overflow-hidden rounded bg-gray-800">
                        {posterSrc ? (
                          <img
                            src={posterSrc}
                            alt={movie.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-700">
                            <FaSearch className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-200">
                          {movie.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {movie.year > 0 && (
                            <span className="text-xs text-gray-500">
                              {movie.year}
                            </span>
                          )}
                          {movie.origin_name && movie.origin_name !== movie.name && (
                            <span className="truncate text-xs text-gray-600">
                              {movie.origin_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: View all results */}
          {showResults && !isLoading && items.length > 0 && (
            <div className="border-t border-gray-800 p-2">
              <button
                type="button"
                onClick={handleViewAll}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400"
              >
                <span>{t('search.pressEnterHint', 'Xem tất cả kết quả')}</span>
                <kbd className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  Enter
                </kbd>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
