import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import MovieCard from '@/components/movie/MovieCard';
import { GridSkeleton, EmptyState } from '@/components/common';
import type { MovieListItem } from '@/types';

interface MovieGridProps {
  movies: MovieListItem[];
  isLoading?: boolean;
}

const MovieGrid: React.FC<MovieGridProps> = ({ movies, isLoading = false }) => {
  const { t: _t } = useTranslation();

  if (isLoading) {
    return <GridSkeleton />;
  }

  if (!movies.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {movies.map((movie) => (
        <MovieCard key={movie._id ?? movie.slug} movie={movie} />
      ))}
    </div>
  );
};

export default memo(MovieGrid);
