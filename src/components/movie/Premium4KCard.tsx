import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

import { ROUTES } from '@/constants';
import { getMoviePoster, onImgError } from '@/utils';
import type { MovieSource } from '@/api/dualSource';
import MovieHoverWrapper from '@/components/movie/MovieHoverWrapper';
import type { MovieListItem } from '@/types';

interface Premium4KCardProps {
  movie: MovieListItem;
}

/** Language pins (PĐ / TM / LT), same rule set as the standard MovieCard so
 *  the "Phim 4K" row reads identically to every other card on the site. */
function buildLangPins(lang?: string) {
  const raw = (lang || '').toLowerCase();
  const pins: { label: string; className: string }[] = [];
  if (/lồng|long tieng|\blt\b/.test(raw)) pins.push({ label: 'LT', className: 'bg-[#1667cf]' });
  if (/thuyết|thuyet|\btm\b/.test(raw)) pins.push({ label: 'TM', className: 'bg-[#2ca35d]' });
  if (/vietsub|phụ đề|phu de|\bpđ\b|\bpd\b|\bvs\b/.test(raw))
    pins.push({ label: 'PĐ', className: 'bg-[#5e6070]' });
  if (pins.length === 0 && raw) pins.push({ label: 'PĐ', className: 'bg-[#5e6070]' });
  return pins;
}

/**
 * "Phim 4K" showcase card — same 2:3 portrait poster + title-underneath
 * skeleton as the standard MovieCard (so it still lines up in a grid and
 * reads correctly), but dressed in its own premium finish so the row feels
 * like a distinct "tier" rather than a re-skinned MovieCard: a diagonal
 * "ULTRA 4K" ribbon instead of the plain circle badge, a gold↔cyan glow
 * frame that lights up on hover, and a small "2160p" mark under the title.
 */
const Premium4KCard: React.FC<Premium4KCardProps> = ({ movie }) => {
  const posterSrc = getMoviePoster(movie.poster_url, movie.thumb_url);
  const rating = movie.tmdb?.vote_average
    ? parseFloat(String(movie.tmdb.vote_average))
    : null;
  const langPins = buildLangPins(movie.lang);

  // Episode badge — bottom-left, same "12/24" / "Tập 12" / "Full" logic as
  // the standard MovieCard.
  const episodeBadge = (() => {
    const ep = movie.episode_current;
    if (!ep) return '';
    const match = ep.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    const tapMatch = ep.match(/[Tt]ập\s*(\d+)/);
    if (tapMatch) {
      const current = tapMatch[1];
      const total = movie.episode_total;
      if (total && total !== '?' && total !== '0') return `${current}/${total}`;
      return `Tập ${current}`;
    }
    if (ep === 'Full') return 'Full';
    return ep;
  })();

  // Episode number used inside the lang pins — e.g. "PĐ.43".
  const epNum = (() => {
    const ep = movie.episode_current;
    if (!ep) return '';
    const m = String(ep).match(/\d+/);
    return m ? m[0] : '';
  })();

  const source: MovieSource =
    ((movie as MovieListItem & { _source?: MovieSource })._source) ?? 'phimapi';
  const detailUrl =
    source !== 'phimapi'
      ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${source}`
      : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;

  return (
    <MovieHoverWrapper movie={movie}>
      <div className="group/4k flex flex-col gap-2.5">
        {/* Gradient glow frame — thin gold↔cyan border that brightens and
            casts a soft glow on hover, the card's main "premium tier" tell
            at a glance before you even notice the ribbon. */}
        <div className="relative rounded-xl bg-gradient-to-br from-[#ffd166]/50 via-white/10 to-[#4dd0ff]/40 p-[1.5px] transition-shadow duration-300 group-hover/4k:shadow-[0_0_22px_-2px_rgba(255,209,102,0.45)]">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[10px] bg-gray-900">
            <Link to={detailUrl} aria-label={movie.name} title={movie.name} className="absolute inset-0 z-[1]">
              <img
                src={posterSrc}
                alt={movie.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover/4k:scale-105"
                onError={onImgError}
              />
              {/* Faint vignette so the corner ribbon/rating stay legible on
                  bright posters — the one flourish that reads "premium
                  transfer" rather than just "poster with a sticker on it". */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
            </Link>

            {/* Diagonal "ULTRA 4K" ribbon — top-left corner, distinct from
                the plain circular quality badge every other card uses. */}
            <div className="pointer-events-none absolute left-0 top-0 z-[2] h-16 w-16 overflow-hidden">
              <span className="absolute -left-9 top-[13px] block w-[130px] -rotate-45 bg-gradient-to-r from-[#ffb524] via-[#ffe8ab] to-[#ffb524] py-[3px] text-center text-[9px] font-black tracking-wider text-[#1a1205] shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
                ULTRA 4K
              </span>
            </div>

            {/* Rating — top-right (IMDb gold) */}
            {rating !== null && rating > 0 && (
              <span className="absolute right-[.3rem] top-[.3rem] z-[2] flex items-center gap-0.5 rounded-[.28rem] bg-black/60 px-1 py-[1px] text-[10px] font-bold text-[#ffd166] backdrop-blur-sm">
                <FaStar className="h-2 w-2" />
                {rating.toFixed(1)}
              </span>
            )}

            {/* Episode badge — bottom-left */}
            {episodeBadge && (
              <span className="absolute bottom-[.3rem] left-[.3rem] z-[2] rounded-[.28rem] bg-black/70 px-1.5 py-[2px] text-[10px] font-bold text-white backdrop-blur-sm">
                {episodeBadge}
              </span>
            )}

            {/* LT/TM/PĐ pin(s) — bottom center, each with episode count (PĐ.43) */}
            {langPins.length > 0 && (
              <div className="absolute bottom-0 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1">
                {langPins.map((p) => (
                  <span
                    key={p.label}
                    className={`rounded-t-[.3rem] px-1.5 py-[2px] text-[10px] font-bold text-white shadow-[0_0_5px_2px_rgba(0,0,0,0.1)] ${p.className}`}
                  >
                    {p.label}
                    {epNum ? `.${epNum}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title below image — same as the standard MovieCard, plus a small
            "2160p" mark that carries the premium identity down past the
            poster itself. */}
        <div className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-normal leading-snug text-white transition-colors group-hover/4k:text-[#ffd166]">
            <Link to={detailUrl}>{movie.name}</Link>
          </h3>
          <p className="mt-0.5 line-clamp-1 flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="shrink-0 font-semibold tracking-wide text-[#4dd0ff]/80">2160p</span>
            {[movie.origin_name && movie.origin_name !== movie.name ? movie.origin_name : null, movie.year > 0 ? movie.year : null]
              .filter(Boolean).length > 0 && <span className="shrink-0">·</span>}
            <span className="truncate">
              {[movie.origin_name && movie.origin_name !== movie.name ? movie.origin_name : null, movie.year > 0 ? movie.year : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
        </div>
      </div>
    </MovieHoverWrapper>
  );
};

export default memo(Premium4KCard);