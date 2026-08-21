import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface SectionTitleProps {
  title: string;
  viewAllLink?: string;
  /** Extra classes on the wrapping <div> (spacing overrides, etc). */
  className?: string;
}

/**
 * Section header in Tô Phim / tophim style: white bold title on the left,
 * subtle "Xem tất cả" link on the right (hidden on mobile).
 */
export default function SectionTitle({ title, viewAllLink, className = '' }: SectionTitleProps) {
  const { t } = useTranslation();

  return (
    <div className={`mb-4 flex items-center justify-between pb-2 ${className}`}>
      <h2 className="text-lg font-bold leading-tight text-white sm:text-xl lg:text-[22px]">
        {title}
      </h2>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          aria-label={t('common.seeAll')}
          className="group flex shrink-0 items-center gap-1 text-[13px] font-medium text-white/70 transition-colors hover:text-[#ffd166]"
        >
          <span className="hidden sm:inline">{t('common.seeAll')}</span>
          {/* Mobile: a bare outlined ">" circle — "Xem tất cả" text has no
              room here, so the arrow alone stands in for it. */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 sm:hidden">
            <FaChevronRight className="h-3 w-3" />
          </span>
          <FaChevronRight className="hidden h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:inline-block" />
        </Link>
      )}
    </div>
  );
}