import { useEffect, type RefObject } from 'react';

// ==========================================================================
// Barrel export for all custom hooks.
// Single-purpose hooks live in their own module (importable directly, e.g.
// `@/hooks/useDebounce`, or via this barrel, e.g. `@/hooks`).
// ==========================================================================

export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useScrollPosition } from './useScrollPosition';
export { useMediaQuery } from './useMediaQuery';
export {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
} from './useIntersectionObserver';

// React Query hooks (latest movies, movie detail, search, genres, countries, etc.)
export * from './useMovieQueries';

/* ------------------------------------------------------------------ */
/* useClickOutside                                                     */
/* ------------------------------------------------------------------ */

/**
 * Invokes `handler` when a click (or touch) occurs outside of the
 * element referenced by `ref`. Handy for dropdowns, modals, and popovers.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
