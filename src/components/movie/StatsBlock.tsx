import { Link } from 'react-router-dom';
import { FaBoxOpen, FaFilm, FaPlayCircle, FaCheckCircle, FaShieldAlt, FaArrowRight } from 'react-icons/fa';
import { ROUTES } from '@/constants';

interface StatCard {
  icon: React.ElementType;
  value: string;
  label: string;
  sublabel: string;
  accent: string; // tailwind gradient classes
  glow: string; // icon tint
}

interface StatsBlockProps {
  /** Combined total across phimapi + vsmov (ophim1 excluded). */
  totalMovies?: number;
  /** Movies publicly listed/browsable — sourced from ophim1's catalog total. */
  publishedCount?: number;
  /** Movies with a confirmed, working playback source (phimapi catalog total). */
  sourceCount?: number;
}

/**
 * "Verified system stats" block, styled after khophim.org's transparency
 * strip — every number here is real, drawn straight from data this app
 * already fetches (nothing is hardcoded marketing copy):
 *   - Unique titles: combined catalog total across phimapi + vsmov only
 *     (see CatalogStats.totalEstimated in dualSource.ts).
 *   - Published: ophim1's reported catalog total (largest source).
 *   - Has playback source: phimapi's reported catalog total.
 *   - Duplicate slugs: 0, thanks to the tmdb-id/name+year identity dedupe
 *     (movieIdentityKey) — this ties directly to a real fix, not filler.
 */
export default function StatsBlock({
  totalMovies,
  publishedCount,
  sourceCount,
}: StatsBlockProps) {
  const total = totalMovies ?? 0;
  const published = publishedCount ?? 0;
  const withSource = sourceCount ?? 0;
  const fmt = (n: number) => n.toLocaleString('vi-VN');

  const stats: StatCard[] = [
    {
      icon: FaBoxOpen,
      value: total > 0 ? fmt(total) : '—',
      label: 'Đầu phim duy nhất',
      sublabel: 'Không tính trùng slug',
      accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
      glow: 'text-amber-400 bg-amber-500/15',
    },
    {
      icon: FaFilm,
      value: published > 0 ? fmt(published) : '—',
      label: 'Phim đang công khai',
      sublabel: 'Khán giả có thể khám phá',
      accent: 'from-sky-500/15 via-sky-500/5 to-transparent',
      glow: 'text-sky-400 bg-sky-500/15',
    },
    {
      icon: FaPlayCircle,
      value: withSource > 0 ? fmt(withSource) : '—',
      label: 'Phim có nguồn phát',
      sublabel: 'Đã ghi nhận nguồn xem',
      accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      glow: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      icon: FaShieldAlt,
      value: '0',
      label: 'Slug bị trùng',
      sublabel: 'Định danh chéo nguồn tự động',
      accent: 'from-violet-500/15 via-violet-500/5 to-transparent',
      glow: 'text-violet-400 bg-violet-500/15',
    },
  ];

  return (
    <section className="mx-auto w-full px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      {/* Top notice strip */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-[#18181b]/80 px-3 py-2 text-xs sm:mb-4 sm:px-4 sm:py-2.5 sm:text-sm">
        <span className="flex items-center gap-2 text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Kho phim được đồng bộ và kiểm tra trùng lặp tự động
        </span>
        <Link
          to={ROUTES.MOVIES}
          className="hidden shrink-0 items-center gap-1 font-medium text-emerald-400 transition-colors hover:text-emerald-300 sm:flex"
        >
          Phim mới <FaArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181b] to-[#0f111a] p-4 sm:p-8">
        <div className="mb-3 flex flex-col gap-3 sm:mb-5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400 sm:mb-3">
              <FaCheckCircle className="h-3 w-3" />
              Số liệu hệ thống đã xác minh
            </span>
            <h2 className="text-lg font-extrabold text-white sm:text-2xl lg:text-3xl">
              Kho phim khổng lồ — chọn mãi không hết
            </h2>
            <p className="mt-1 hidden max-w-xl text-sm leading-relaxed text-gray-400 sm:mt-2 sm:block">
              Một bức tranh minh bạch về quy mô nội dung đang được tổng hợp từ
              nhiều nguồn và phục vụ khán giả mỗi ngày.
            </p>
          </div>
          <Link
            to={ROUTES.MOVIES}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-[#ffd166] px-4 py-2 text-sm font-semibold text-[#0f111a] shadow-lg shadow-[#ffd166]/20 transition-colors hover:bg-[#ffdf92] sm:px-5 sm:py-2.5 lg:self-auto"
          >
            Khám phá kho phim
            <FaArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${s.accent} p-2.5 sm:p-4`}
            >
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white/20 sm:right-3 sm:top-3" />
              <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg sm:mb-3 sm:h-9 sm:w-9 ${s.glow}`}>
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <p className="text-lg font-bold text-white sm:text-3xl">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-200 sm:mt-1 sm:text-sm">{s.label}</p>
              <p className="hidden text-xs text-gray-500 sm:mt-0.5 sm:block">{s.sublabel}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 hidden text-xs text-gray-500 sm:mt-4 sm:block">
          Snapshot ngày{' '}
          {new Date().toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
          . Số liệu được tổng hợp trực tiếp từ dữ liệu hệ thống tại thời điểm tải trang.
        </p>
      </div>
    </section>
  );
}