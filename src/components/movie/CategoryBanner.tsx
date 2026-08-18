import { FaFilm } from 'react-icons/fa';
import { getMoviePoster, onImgError } from '@/utils';

interface CategoryBannerProps {
  /** Small label above the title, e.g. "THỂ LOẠI" / "QUỐC GIA". */
  eyebrow: string;
  title: string;
  /** Short blurb describing what this page/category is about (page-specific). */
  description?: string;
  totalItems?: number;
  /** thumb_url of a representative movie, used as the backdrop image. */
  backdropUrl?: string | null;
  icon?: React.ElementType;
}

/**
 * Wide hero banner for genre/country/listing pages — a full-bleed backdrop
 * image (spans the entire viewport width, edge-to-edge, regardless of the
 * page's own max-width container) with the category name, an optional
 * page-specific description, and a live movie count pulled straight from
 * that page's own query (no separate request). Falls back to a plain
 * gradient panel when no backdrop is available yet (e.g. while the first
 * page of results is loading).
 *
 * The content block (eyebrow/title/description/count) is bottom-aligned
 * and inset to the site's normal content width, so it lines up with the
 * page below even though the image behind it bleeds full width.
 */
export default function CategoryBanner({
  eyebrow,
  title,
  description,
  totalItems,
  backdropUrl,
  icon: Icon = FaFilm,
}: CategoryBannerProps) {
  const bg = backdropUrl ? getMoviePoster(backdropUrl) : '';

  return (
    // Full-bleed trick: break out of any ancestor max-width container by
    // centering on the viewport (left/right 50% + matching negative
    // margins) and forcing the width to 100vw. `overflow-x: hidden` on
    // <body> (see styles/index.css) keeps this from causing a horizontal
    // scrollbar on browsers where 100vw is a touch wider than the
    // scrollbar-adjusted viewport.
    <div className="relative left-1/2 right-1/2 -mx-[50vw] mb-6 w-screen overflow-hidden bg-[#0f111a] lg:-mt-[84px]">
      <div className="relative h-[280px] sm:h-[380px] lg:h-[440px]">
        {bg && (
          <img
            src={bg}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={onImgError}
          />
        )}
        {/* Gradient wash — heavier toward the bottom (where the text sits)
            and toward the left, so the title/description stay legible over
            bright or busy backdrop images. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/55 to-[#0f111a]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f111a]/85 via-[#0f111a]/30 to-transparent" />

        <div className="relative mx-auto flex h-full w-full flex-col justify-end px-4 pb-6 sm:px-6 sm:pb-10 lg:px-8">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#ffd166]">
            <Icon className="h-3 w-3" />
            {eyebrow}
          </span>
          <h1 className="text-2xl font-extrabold text-white [text-shadow:0_2px_1px_rgba(0,0,0,0.3)] drop-shadow-lg sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
              {description}
            </p>
          )}
          {typeof totalItems === 'number' && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-300">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-white backdrop-blur">
                {totalItems.toLocaleString('vi-VN')}
              </span>
              phim hiện có
            </p>
          )}
        </div>
      </div>
    </div>
  );
}