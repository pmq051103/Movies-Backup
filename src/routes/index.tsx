import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import MainLayout from '@/components/layout/MainLayout';
import { LoadingOverlay } from '@/components/common';

const HomePage = React.lazy(() => import('@/pages/HomePage'));
const MoviesPage = React.lazy(() => import('@/pages/MoviesPage'));
const TVShowsPage = React.lazy(() => import('@/pages/TVShowsPage'));
const GenrePage = React.lazy(() => import('@/pages/GenrePage'));
const CountryPage = React.lazy(() => import('@/pages/CountryPage'));
const TopRatedPage = React.lazy(() => import('@/pages/TopRatedPage'));
const SearchPage = React.lazy(() => import('@/pages/SearchPage'));
const MovieDetailPage = React.lazy(() => import('@/pages/MovieDetailPage'));
const WatchPage = React.lazy(() => import('@/pages/WatchPage'));
const FavoritesPage = React.lazy(() => import('@/pages/FavoritesPage'));
const HistoryPage = React.lazy(() => import('@/pages/HistoryPage'));
const NowPlayingPage = React.lazy(() => import('@/pages/NowPlayingPage'));
const DonatePage = React.lazy(() => import('@/pages/DonatePage'));
const DownloadAppPage = React.lazy(() => import('@/pages/DownloadAppPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/phim-le" element={<MoviesPage />} />
          <Route path="/phim-bo" element={<TVShowsPage />} />
          {/* Genre / Country list pages removed by request — nav uses hover
              dropdowns only. Deep-linked slug pages are still supported. */}
          <Route path="/the-loai/:slug" element={<GenrePage />} />
          <Route path="/quoc-gia/:slug" element={<CountryPage />} />
          <Route path="/phim-chieu-rap" element={<NowPlayingPage />} />
          <Route path="/top-rated" element={<TopRatedPage />} />
          <Route path="/tim-kiem" element={<SearchPage />} />
          <Route path="/phim/:slug" element={<MovieDetailPage />} />
          <Route path="/xem/:slug" element={<WatchPage />} />
          <Route path="/yeu-thich" element={<FavoritesPage />} />
          <Route path="/lich-su" element={<HistoryPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/tai-app" element={<DownloadAppPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
