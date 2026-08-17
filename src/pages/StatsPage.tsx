import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FaChartBar,
  FaUsers,
  FaCalendarDay,
  FaPlay,
  FaFilm,
  FaGlobe,
  FaTags,
  FaHashtag,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
} from 'react-icons/fa';

import { Navigate } from 'react-router-dom';
import DonutChart from '@/components/stats/DonutChart';
import LineChart from '@/components/stats/LineChart';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';
import { isAnalyticsConfigured } from '@/lib/supabase';

type PresetDays = 7 | 14 | 30;
type Preset = 'today' | PresetDays | 'custom';

/** yyyy-mm-dd for a Date, in local time (what <input type="date"> needs). */
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetRange(preset: 'today' | PresetDays): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (preset === 'today') {
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - (preset - 1));
    from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'red',
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: 'red' | 'blue' | 'emerald' | 'amber';
}) {
  const accents: Record<string, string> = {
    red: 'from-red-500/20 to-red-600/5 text-red-400',
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400',
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5 transition-all duration-200 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {/* Decorative corner glow — purely visual, matches the login card's premium feel */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.03] blur-2xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function BarRow({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max((count / max) * 100, 6) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate text-gray-300" title={name}>
        {name}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-semibold text-white">{count}</span>
    </div>
  );
}

export function StatsDashboard() {
  const [preset, setPreset] = useState<Preset>('today');
  // Custom range inputs — plain yyyy-mm-dd strings from <input type="date">.
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo(() => {
    if (preset !== 'custom') return presetRange(preset);
    if (customFrom && customTo) {
      const from = new Date(`${customFrom}T00:00:00`);
      const to = new Date(`${customTo}T23:59:59.999`);
      // Guard against an inverted range (to picked before from).
      return from <= to ? { from, to } : { from: to, to: from };
    }
    // Custom mode chosen but not both dates filled in yet — fall back
    // to today so the dashboard still shows data.
    return presetRange('today');
  }, [preset, customFrom, customTo]);

  const { data, isLoading, isError, error, refetch, isFetching } = useAnalyticsStats(range);

  const maxMovie = Math.max(...(data?.topMovies.map((m) => m.count) ?? [0]));
  const maxCategory = Math.max(...(data?.topCategories.map((c) => c.count) ?? [0]));
  const maxCountry = Math.max(...(data?.topCountries.map((c) => c.count) ?? [0]));

  // Top-pages pagination — 20 per page. Reset back to page 1 whenever the
  // selected date range changes, so switching ranges never leaves you
  // stranded on a page number that no longer has data.
  const PATHS_PER_PAGE = 20;
  const [pathsPage, setPathsPage] = useState(1);
  useEffect(() => {
    setPathsPage(1);
  }, [range.from.getTime(), range.to.getTime()]);
  const totalPathsPages = Math.max(1, Math.ceil((data?.topPaths.length ?? 0) / PATHS_PER_PAGE));
  const currentPathsPage = Math.min(pathsPage, totalPathsPages);
  const pagedPaths =
    data?.topPaths.slice(
      (currentPathsPage - 1) * PATHS_PER_PAGE,
      currentPathsPage * PATHS_PER_PAGE,
    ) ?? [];

  const isCustom = preset === 'custom';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400">
            <FaChartBar className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Thống Kê Truy Cập</h1>
            <p className="text-sm text-gray-400">
              Lượt truy cập web và xem phim theo thể loại / quốc gia
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40">
            <button
              onClick={() => setPreset('today')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                preset === 'today'
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Hôm nay
            </button>
            {([7, 14, 30] as PresetDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setPreset(d)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  preset === d
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {d} ngày
              </button>
            ))}
            <button
              onClick={() => setPreset('custom')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isCustom
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tùy chỉnh
            </button>
          </div>

          {isCustom && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 px-3 py-1.5">
              <input
                type="date"
                value={customFrom}
                max={customTo || toDateInputValue(new Date())}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none [color-scheme:dark]"
                aria-label="Từ ngày"
              />
              <span className="text-xs text-gray-500">đến</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={toDateInputValue(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none [color-scheme:dark]"
                aria-label="Đến ngày"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-600/20 transition-all hover:from-red-500 hover:to-red-400 disabled:opacity-60"
            title="Tải lại số liệu"
          >
            <FaSyncAlt className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>
      </div>

      {!isAnalyticsConfigured ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-300">
          Supabase chưa được cấu hình. Thêm <code className="text-amber-200">VITE_SUPABASE_URL</code> và{' '}
          <code className="text-amber-200">VITE_SUPABASE_ANON_KEY</code> vào file <code>.env</code>, sau đó
          chạy file <code>supabase-schema.sql</code> trong SQL Editor của dự án Supabase (xem README).
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
          Không tải được số liệu: {(error as Error)?.message}
        </div>
      ) : isLoading || !data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-900/60" />
          ))}
        </div>
      ) : (
        // xl:items-stretch (grid's default) makes the right column match
        // the left column's total height automatically — that's what lets
        // "Top pages" fill the tall right side instead of being a short
        // full-width strip at the bottom.
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* ── Left column: everything except top-pages ────────────── */}
          <div className="space-y-4 xl:col-span-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={FaUsers} label="Tổng lượt truy cập" value={data.totalViews} accent="red" />
              <StatCard icon={FaCalendarDay} label="Hôm nay" value={data.todayViews} accent="blue" />
              <StatCard icon={FaPlay} label="Lượt xem phim" value={data.movieViewCount} accent="emerald" />
              <StatCard icon={FaFilm} label="Phim được xem" value={data.uniqueMoviesWatched} accent="amber" />
            </div>

            {/* Referrer donut + daily line chart */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel icon={FaGlobe} title="Nguồn truy cập">
                <DonutChart
                  centerLabel={String(data.totalViews)}
                  centerSublabel="lượt"
                  segments={[
                    { label: 'Vào trực tiếp', value: data.directCount, color: '#ef4444' },
                    { label: 'Trang khác', value: data.referralCount, color: '#3b82f6' },
                  ]}
                />
                {data.topReferrers.length > 0 && (
                  <div className="mt-4 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Nguồn dẫn chi tiết
                    </p>
                    <div className="space-y-2">
                      {data.topReferrers.map((r) => (
                        <div key={r.name} className="flex items-center justify-between text-sm">
                          <span className="truncate text-gray-300" title={r.name}>
                            {r.name}
                          </span>
                          <span className="font-semibold text-white">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
              <Panel icon={FaChartBar} title="Truy cập theo ngày">
                <div className="h-44">
                  <LineChart points={data.dailySeries} />
                </div>
              </Panel>
            </div>

            {/* Top movies / categories / countries */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Panel icon={FaFilm} title="Phim được xem nhiều nhất">
                {data.topMovies.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.topMovies.map((m) => (
                      <BarRow key={m.name} name={m.name} count={m.count} max={maxMovie} />
                    ))}
                  </div>
                )}
              </Panel>
              <Panel icon={FaTags} title="Xem theo thể loại">
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.topCategories.map((c) => (
                      <BarRow key={c.name} name={c.name} count={c.count} max={maxCategory} />
                    ))}
                  </div>
                )}
              </Panel>
              <Panel icon={FaGlobe} title="Xem theo quốc gia">
                {data.topCountries.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.topCountries.map((c) => (
                      <BarRow key={c.name} name={c.name} count={c.count} max={maxCountry} />
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>

          {/* ── Right column: top pages, stretched to match the left
              column's full height (grid's default stretch alignment). ── */}
          <div className="xl:col-span-4">
            <Panel icon={FaHashtag} title="Trang được truy cập nhiều nhất" className="flex h-full flex-col">
              {data.topPaths.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              ) : (
                <>
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {pagedPaths.map((p) => (
                      <div
                        key={p.path}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-900/60"
                      >
                        <span className="truncate text-gray-300">{p.path}</span>
                        <span className="shrink-0 font-semibold text-white">{p.count}</span>
                      </div>
                    ))}
                  </div>

                  {totalPathsPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
                      <button
                        type="button"
                        onClick={() => setPathsPage((p) => Math.max(1, p - 1))}
                        disabled={currentPathsPage === 1}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      >
                        <FaChevronLeft className="h-2.5 w-2.5" />
                        Trước
                      </button>
                      <span className="text-xs text-gray-500">
                        Trang {currentPathsPage}/{totalPathsPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPathsPage((p) => Math.min(totalPathsPages, p + 1))}
                        disabled={currentPathsPage === totalPathsPages}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      >
                        Sau
                        <FaChevronRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Legacy route /thong-ke → redirect to the admin dashboard.           */
/* StatsDashboard above (the real, populated dashboard — reads         */
/* page_views/movie_views straight from Supabase client-side) is       */
/* embedded inside /admin's "Thống kê" tab.                            */
/* ------------------------------------------------------------------ */

export default function StatsPage() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navigate to="/admin" replace />
    </>
  );
}