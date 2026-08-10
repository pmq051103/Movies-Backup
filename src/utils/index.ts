import type { MovieType, FilterState, FilterParams } from '@/types';
import { IMAGE_BASE_URL } from '@/constants';

/* ------------------------------------------------------------------ */
/* Image URL                                                           */
/* ------------------------------------------------------------------ */

/** Placeholder poster for movies with no image from API. */
export const PLACEHOLDER_POSTER = '/placeholder-poster.svg';

/** onError handler for <img> — swaps to placeholder on broken image. */
export function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== PLACEHOLDER_POSTER && !img.src.endsWith('placeholder-poster.svg')) {
    img.src = PLACEHOLDER_POSTER;
  }
}

/**
 * Resolves a poster or thumbnail path to a full URL.
 * Returns empty string for invalid paths — use `getMoviePoster`
 * for automatic placeholder fallback.
 */
export function getImageUrl(path: unknown): string {
  if (typeof path !== 'string' || path.length === 0) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${IMAGE_BASE_URL}/${path.replace(/^\//, '')}`;
}

/**
 * Returns the best available image for a movie, falling back to the
 * placeholder SVG if neither poster nor thumb is available.
 * Use this wherever you display a movie poster/thumbnail.
 */
export function getMoviePoster(posterUrl: unknown, thumbUrl?: unknown): string {
  return getImageUrl(posterUrl) || getImageUrl(thumbUrl) || PLACEHOLDER_POSTER;
}

/* ------------------------------------------------------------------ */
/* Date / duration formatting                                          */
/* ------------------------------------------------------------------ */

/**
 * Formats an ISO date string (or Date) into a localized, human-readable
 * date, e.g. "6 thg 8, 2026" (vi) or "Aug 6, 2026" (en).
 */
export function formatDate(
  dateString: string | number | Date | undefined | null,
  locale: string = 'vi-VN',
): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Returns the year as a string, or 'N/A' when the value is falsy.
 */
export function formatYear(year: number | string | undefined | null): string {
  if (!year && year !== 0) return 'N/A';
  return String(year);
}

/**
 * Formats a duration given in **minutes** into a human-readable string,
 * e.g. 135 -> "2h 15m". Returns an empty string for invalid input.
 */
export function formatDuration(minutes: number | undefined | null): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Formats a duration given in **seconds** as a time-code string,
 * e.g. 95 -> "01:35", 3725 -> "01:02:05". Used for player progress display.
 */
export function formatTimecode(seconds: number | undefined | null): string {
  if (!seconds || seconds < 0) return '00:00';

  const totalSeconds = Math.floor(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Formats a number in compact notation, e.g. 1500 -> "1.5K", 2300000 -> "2.3M".
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || Number.isNaN(num)) return '0';

  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    return String(num);
  }
}

/* ------------------------------------------------------------------ */
/* Text formatting                                                     */
/* ------------------------------------------------------------------ */

/**
 * Truncates `text` to `maxLength` characters, appending an ellipsis
 * when the text exceeds the limit.
 */
export function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Converts arbitrary text into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric
    .replace(/[\s_]+/g, '-') // spaces / underscores to hyphens
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

/**
 * Converts a URL slug back into a readable title,
 * e.g. "spider-man-no-way-home" -> "Spider Man No Way Home".
 */
export function slugToTitle(slug: string | undefined | null): string {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/* ------------------------------------------------------------------ */
/* Movie type label                                                    */
/* ------------------------------------------------------------------ */

const MOVIE_TYPE_LABELS: Record<MovieType, string> = {
  single: 'Phim lẻ',
  series: 'Phim bộ',
  hoathinh: 'Hoạt hình',
  tvshows: 'TV Shows',
};

/**
 * Returns a display label for a `MovieType` value.
 */
export function getMovieTypeLabel(type: MovieType): string {
  return MOVIE_TYPE_LABELS[type] ?? type;
}

/* ------------------------------------------------------------------ */
/* Filters                                                              */
/* ------------------------------------------------------------------ */

/**
 * Converts a UI-level `FilterState` object into the `FilterParams` shape
 * expected by the API, stripping empty/undefined values.
 */
export function buildFilterParams(filters: FilterState): FilterParams {
  const params: FilterParams = {};

  if (filters.genre) params.category = filters.genre;
  if (filters.country) params.country = filters.country;
  if (filters.year) params.year = filters.year;
  if (filters.status) params.status = filters.status;
  if (filters.sortField) params.sort_field = filters.sortField;
  if (filters.sortType) params.sort_type = filters.sortType;
  if (filters.page) params.page = filters.page;

  return params;
}

/**
 * Returns an array of years from the current year down to 1990 (inclusive),
 * suitable for populating a "release year" filter dropdown.
 */
export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1990; y--) {
    years.push(y);
  }
  return years;
}

/* ------------------------------------------------------------------ */
/* Classnames                                                           */
/* ------------------------------------------------------------------ */

type ClassValue = string | number | boolean | null | undefined | Record<string, boolean>;

/**
 * Merges class names conditionally, skipping falsy values.
 * Supports plain strings and `{ className: boolean }` objects.
 *
 * Example: cn('btn', isActive && 'btn-active', { 'btn-disabled': disabled })
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const entry of classes) {
    if (!entry) continue;

    if (typeof entry === 'string' || typeof entry === 'number') {
      result.push(String(entry));
      continue;
    }

    if (typeof entry === 'object') {
      for (const [key, value] of Object.entries(entry)) {
        if (value) result.push(key);
      }
    }
  }

  return result.join(' ').trim();
}

/* ------------------------------------------------------------------ */
/* Video helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Extracts a YouTube video ID from common URL formats
 * (watch?v=, youtu.be/, embed/), or returns the input unchanged
 * if it already looks like a bare video ID.
 */
export function extractVideoId(url: string | undefined | null): string {
  if (!url) return '';

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  // Already a bare 11-character video ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return '';
}

/* ------------------------------------------------------------------ */
/* Array helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns `count` random, unique items from `array` (order randomized).
 * If `count` >= array.length, a shuffled copy of the full array is returned.
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  if (!Array.isArray(array) || array.length === 0 || count <= 0) return [];

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
