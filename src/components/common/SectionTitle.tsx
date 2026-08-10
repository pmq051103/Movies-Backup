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
 * Shared section header: title with a short gradient underline accent
 * (fading red → transparent) plus an optional "see all" link on the
 * right. Used across every horizontal row / grid section site-wide so
 * headings read as one consistent visual system instead of plain text.
 */
export default function SectionTitle({ title, viewAllLink, className = '' }: SectionTitleProps) {
  const { t } = useTranslation();

  return (
    <div className={`mb-5 flex items-center justify-between ${className}`}>
      <div className="relative inline-block pb-2">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[3px] w-14 rounded-full bg-gradient-to-r from-red-500 to-red-500/0 sm:w-20"
        />
      </div>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="flex shrink-0 items-center gap-1 text-sm text-gray-400 transition-colors hover:text-red-500"
        >
          {t('common.seeAll')}
          <FaChevronRight className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  );
}
