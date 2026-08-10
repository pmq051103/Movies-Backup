import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after `delay` ms of inactivity.
 * Defaults to a 500ms delay, tuned for search-as-you-type inputs.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
