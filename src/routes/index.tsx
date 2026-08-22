import { Suspense, lazy, type ReactNode } from "react";
import { Route, Routes, Navigate } from "react-router";
import { useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { LoadingOverlay } from "@/components/common";
import { useMaintenance } from "@/hooks/useMaintenance";
import MaintenancePage from "@/pages/MaintenancePage";

const HomePage = lazy(() => import("@/pages/HomePage"));
const MoviesPage = lazy(() => import("@/pages/MoviesPage"));
const TVShowsPage = lazy(() => import("@/pages/TVShowsPage"));
const AnimePage = lazy(() => import("@/pages/AnimePage"));
const TvShowProgramPage = lazy(() => import("@/pages/TvShowProgramPage"));
const GenrePage = lazy(() => import("@/pages/GenrePage"));
const CountryPage = lazy(() => import("@/pages/CountryPage"));
const TopRatedPage = lazy(() => import("@/pages/TopRatedPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const MovieDetailPage = lazy(() => import("@/pages/MovieDetailPage"));
const WatchPage = lazy(() => import("@/pages/WatchPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const NowPlayingPage = lazy(() => import("@/pages/NowPlayingPage"));
const Phim4KPage = lazy(() => import("@/pages/Phim4KPage"));
const ThuyetMinhPage = lazy(() => import("@/pages/ThuyetMinhPage"));
const LongTiengPage = lazy(() => import("@/pages/LongTiengPage"));
const CoTrangTQPage = lazy(() => import("@/pages/CoTrangTQPage"));
const DonatePage = lazy(() => import("@/pages/DonatePage"));
const DownloadAppPage = lazy(() => import("@/pages/DownloadAppPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

/* ------------------------------------------------------------------ */
/* MaintenanceGate — when maintenance mode is on, every public page is  */
/* replaced by the maintenance page. The /admin route is exempt so the  */
/* admin can switch the mode back off.                                 */
/* ------------------------------------------------------------------ */

function MaintenanceGate({ children }: { children: ReactNode }) {
  const { loading, enabled } = useMaintenance();
  if (loading) return <LoadingOverlay />;
  if (enabled) return <MaintenancePage />;
  return <>{children}</>;
}

export default function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Suspense fallback={<LoadingOverlay />}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <MaintenanceGate>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/phim-le" element={<MoviesPage />} />
            <Route path="/phim-bo" element={<TVShowsPage />} />
            <Route path="/hoathinh" element={<AnimePage />} />
            <Route path="/tv-shows" element={<TvShowProgramPage />} />
            {/* Genre / Country list pages removed by request — nav uses hover
                dropdowns only. Deep-linked slug pages are still supported. */}
            <Route path="/the-loai/:slug" element={<GenrePage />} />
            <Route path="/quoc-gia/:slug" element={<CountryPage />} />
            <Route path="/phim-chieu-rap" element={<NowPlayingPage />} />
            <Route path="/phim-4k" element={<Phim4KPage />} />
            <Route path="/phim-thuyet-minh" element={<ThuyetMinhPage />} />
            <Route path="/phim-long-tieng" element={<LongTiengPage />} />
            <Route path="/co-trang-trung-quoc" element={<CoTrangTQPage />} />
            <Route path="/top-rated" element={<TopRatedPage />} />
            <Route path="/tim-kiem" element={<SearchPage />} />
            <Route path="/phim/:slug" element={<MovieDetailPage />} />
            <Route path="/xem/:slug" element={<WatchPage />} />
            <Route path="/yeu-thich" element={<FavoritesPage />} />
            <Route path="/lich-su" element={<HistoryPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/tai-app" element={<DownloadAppPage />} />
            <Route path="/thong-ke" element={<StatsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MaintenanceGate>
    </Suspense>
  );
}
