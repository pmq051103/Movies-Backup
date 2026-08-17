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
          className="group hidden shrink-0 items-center gap-1 text-[13px] font-medium text-white/70 transition-colors hover:text-[#ffd166] sm:inline-flex"
        >
          <span>{t('common.seeAll')}</span>
          <FaChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
