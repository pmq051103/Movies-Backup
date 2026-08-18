import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants';

interface Pill {
  label: string;
  to?: string;
  active?: boolean;
}

const PILLS: Pill[] = [
  { label: 'Đề xuất', to: ROUTES.HOME, active: true },
  { label: 'Phim bộ', to: ROUTES.TV_SHOWS },
  { label: 'Phim lẻ', to: ROUTES.MOVIES },
  { label: 'Thể loại', to: ROUTES.GENRES },
];

/** Cobephim.biz category pills row: white-outlined rounded pills with the
 *  active one filled. Overflow-x on mobile with hidden scrollbar. */
export default function CategoryPills() {
  return (
    <nav
      className="relative z-20 mx-auto max-w-6xl px-4"
      aria-label="Danh mục nội dung"
    >
      <div className="flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PILLS.map((pill) => {
          const cls = `inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors ${
            pill.active
              ? 'border-[#ffd875] bg-[#ffd875] text-[#191b24]'
              : 'border-white/90 text-white hover:bg-white/10'
          }`;
          if (pill.to) {
            return (
              <Link key={pill.label} to={pill.to} className={cls}>
                {pill.label}
              </Link>
            );
          }
          return (
            <span key={pill.label} className={cls}>
              {pill.label}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
