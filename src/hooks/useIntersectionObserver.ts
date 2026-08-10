import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** When true, stop observing once the element has intersected once. */
  freezeOnceVisible?: boolean;
}

/**
 * Observes an element's visibility relative to the viewport (or a scroll
 * container) via the IntersectionObserver API. Useful for lazy-loading
 * images/sections and for triggering "load more" in infinite scroll lists.
 *
 * Example (infinite scroll):
 *   const sentinelRef = useRef<HTMLDivElement>(null);
 *   const isVisible = useIntersectionObserver(sentinelRef, { rootMargin: '200px' });
 *   useEffect(() => { if (isVisible) fetchNextPage(); }, [isVisible]);
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  elementRef: RefObject<T | null>,
  options: UseIntersectionObserverOptions = {},
): boolean {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (frozen.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setIsIntersecting(visible);

        if (visible && freezeOnceVisible) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  return isIntersecting;
}

export default useIntersectionObserver;
