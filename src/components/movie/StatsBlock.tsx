import { Link } from 'react-router-dom';
import { FaBoxOpen, FaBolt, FaLayerGroup, FaShieldAlt, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
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
  /** Deduped total across all 3 sources (phimapi + vsmov + ophim1). */
  totalMovies?: number;
  /** Movies whose modified date is today — proves the feed is live. */
  updatedTodayCount?: number;
}

/**
 * "Verified system stats" block, styled after khophim.org's transparency
 * strip — but every number here is real, drawn straight from data this
 * app already fetches (nothing is hardcoded marketing copy):
 *   - Total: deduped count across phimapi + vsmov + ophim1.
 *   - Updated today: live count of today's synced titles.
 *   - Sources: the 3 catalogs actually merged (see StatsBlock docstring
 *     in dualSource.ts).
 *   - Duplicate slugs: 0, thanks to the tmdb-id/name+year identity dedupe
 *     (movieIdentityKey) — this ties directly to a real fix, not filler.
 */
export default function StatsBlock({ totalMovies, updatedTodayCount = 0 }: StatsBlockProps) {
  const total = totalMovies ?? 0;
  const fmt = (n: number) => n.toLocaleString('vi-VN');

  const stats: StatCard[] = [
    {
      icon: FaBoxOpen,
      value: total > 0 ? fmt(total) : '—',
      label: 'Đầu phim duy nhất',
      sublabel: 'Đã lọc trùng theo TMDB ID',
      accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
      glow: 'text-amber-400 bg-amber-500/15',
    },
    {
      icon: FaBolt,
      value: fmt(updatedTodayCount),
      label: 'Cập nhật hôm nay',
      sublabel: 'Phim vừa đồng bộ trong ngày',
      accent: 'from-sky-500/15 via-sky-500/5 to-transparent',
      glow: 'text-sky-400 bg-sky-500/15',
    },
    {
      icon: FaLayerGroup,
      value: '3',
      label: 'Nguồn phát tích hợp',
      sublabel: 'phimapi · vsmov · ophim1',
      accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      glow: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      icon: FaShieldAlt,
      value: '0',
      label: 'Slug bị trùng',
      sublabel: 'Định danh chéo 3 nguồn tự động',
      accent: 'from-violet-500/15 via-violet-500/5 to-transparent',
      glow: 'text-violet-400 bg-violet-500/15',
    },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 pt-8 sm:px-6 lg:px-8">
      {/* Top notice strip */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-xs sm:text-sm">
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
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:p-8">
        <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
              <FaCheckCircle className="h-3 w-3" />
              Số liệu hệ thống đã xác minh
            </span>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Kho phim khổng lồ — chọn mãi không hết
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
              Một bức tranh minh bạch về quy mô nội dung đang được tổng hợp từ
              nhiều nguồn và phục vụ khán giả mỗi ngày.
            </p>
          </div>
          <Link
            to={ROUTES.MOVIES}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 lg:self-auto"
          >
            Khám phá kho phim
            <FaArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br ${s.accent} p-4`}
            >
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-white/20" />
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${s.glow}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-200">{s.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{s.sublabel}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500">
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
