import React from 'react';

export const MovieCardSkeleton: React.FC = () => {
  return (
    <div>
      <div className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse" />
      <div className="h-4 bg-gray-700 rounded mt-2 w-3/4 animate-pulse" />
    </div>
  );
};

export const MovieRowSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="h-6 bg-gray-700 rounded w-48 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[180px] flex-shrink-0">
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[70vh] bg-gray-800 animate-pulse">
      <div className="absolute bottom-12 left-8 space-y-4 max-w-xl">
        <div className="h-10 bg-gray-700 rounded w-96 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-12 w-32 bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-12 w-40 bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div>
      <div className="w-full h-[50vh] bg-gray-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-[260px] flex-shrink-0">
            <div className="aspect-[2/3] bg-gray-700 rounded-lg animate-pulse" />
          </div>
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-8 bg-gray-700 rounded w-2/3 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-36 bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-12 w-12 bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-12 w-12 bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GridSkeletonProps {
  count?: number;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({ count = 18 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
};
