import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '@/constants';

/**
 * TMDB cast member as returned by `/movie/{id}/credits` or `/tv/{id}/credits`.
 * Only the fields the UI actually uses are declared.
 */
export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

/** A single backdrop/poster entry from TMDB's `/images` response. */
export interface TmdbImage {
  file_path: string;
  width: number;
  height: number;
}

/** A single trailer/clip entry from TMDB's `/videos` response. */
export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

/**
 * TMDB crew member (director, writer, etc.) as returned by `/credits`.
 * Only the fields the UI actually uses are declared.
 */
export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface TmdbExtras {
  cast: TmdbCastMember[];
  directors: TmdbCrewMember[];
  backdrops: TmdbImage[];
  posters: TmdbImage[];
  videos: TmdbVideo[];
}

const EMPTY_EXTRAS: TmdbExtras = { cast: [], directors: [], backdrops: [], posters: [], videos: [] };

interface TmdbDetailsWithExtras {
  credits?: { cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] };
  images?: { backdrops?: TmdbImage[]; posters?: TmdbImage[] };
  videos?: { results?: TmdbVideo[] };
}

/** True for TMDB's older 32-char hex v3 API key (goes in `?api_key=`),
 *  false for the long v4 JWT "Read Access Token" (goes in the
 *  `Authorization: Bearer` header). Configuring either one now works. */
function isV3ApiKey(key: string): boolean {
  return /^[a-f0-9]{32}$/i.test(key);
}

/** Resolve a TMDB profile_path/file_path into a full, ready-to-render image URL. */
export function getTmdbImageUrl(
  filePath: string | null | undefined,
  size: 'w185' | 'w300' | 'w780' | 'w1280' | 'h632' | 'original' = 'w185',
): string | null {
  if (!filePath) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${filePath}`;
}

/** @deprecated use {@link getTmdbImageUrl} — kept as an alias for callers. */
export const getTmdbProfileUrl = getTmdbImageUrl;

/** YouTube thumbnail for a video `key` — used for gallery video cards. */
export function getYoutubeThumbnail(key: string): string {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}

/** Full YouTube watch URL for a video `key`. */
export function getYoutubeWatchUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${key}`;
}

/**
 * Fetch cast (with headshots), real per-title gallery images (backdrops +
 * posters), and trailer/clip videos for a movie/tv title — all in ONE
 * request via TMDB's `append_to_response`, keyed off the `movie.tmdb.id`
 * the phim API already attaches to every title (no extra search/matching
 * step needed on our side).
 *
 * Resolves to empty arrays (never throws) when there's no API key
 * configured, no tmdb id on the movie, or the request fails — callers fall
 * back to their own placeholder/local-only UI in that case.
 */
export async function getTmdbExtras(
  tmdbId: string | number | null | undefined,
  tmdbType: string | null | undefined,
): Promise<TmdbExtras> {
  if (!TMDB_API_KEY || !tmdbId) return EMPTY_EXTRAS;

  // The phim APIs use 'tv' for series same as TMDB; anything else
  // (single/hoathinh/tvshows treated as a single title) maps to 'movie'.
  const mediaType = tmdbType === 'tv' ? 'tv' : 'movie';

  try {
    // TMDB has two API key formats: the short 32-char hex "v3" key (must be
    // sent as a `?api_key=` query param) and the long JWT-style "v4 Read
    // Access Token" (must be sent as an `Authorization: Bearer` header).
    // Using the wrong scheme for a given key returns 401 Unauthorized —
    // detect which one is configured instead of assuming v4.
    const v3 = isV3ApiKey(TMDB_API_KEY);
    const url =
      `${TMDB_BASE_URL}/${mediaType}/${tmdbId}` +
      `?language=vi-VN&append_to_response=credits,images,videos` +
      `&include_image_language=vi,en,null` +
      (v3 ? `&api_key=${TMDB_API_KEY}` : '');

    const res = await fetch(url, {
      headers: v3
        ? { accept: 'application/json' }
        : { Authorization: `Bearer ${TMDB_API_KEY}`, accept: 'application/json' },
    });
    if (!res.ok) return EMPTY_EXTRAS;
    const data = (await res.json()) as TmdbDetailsWithExtras;
    return {
      cast: (data.credits?.cast ?? []).slice(0, 18),
      directors: (data.credits?.crew ?? []).filter((c) => c.job === 'Director'),
      backdrops: (data.images?.backdrops ?? []).slice(0, 12),
      posters: (data.images?.posters ?? []).slice(0, 8),
      videos: (data.videos?.results ?? [])
        .filter((v) => v.site === 'YouTube')
        .slice(0, 8),
    };
  } catch {
    return EMPTY_EXTRAS;
  }
}
