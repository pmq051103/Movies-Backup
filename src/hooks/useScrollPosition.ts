import { useEffect, useState } from 'react';

/**
 * Tracks the current vertical scroll position of the window.
 * Uses a passive event listener for optimal scroll performance.
 * Handy for toggling header transparency/blur on scroll.
 */
export function useScrollPosition(): number {
  const [scrollY, setScrollY] = useState<number>(
    typeof window !== 'undefined' ? window.scrollY : 0,
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollY;
}

export default useScrollPosition;
