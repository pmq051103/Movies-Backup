interface GridSkeletonProps {
  count?: number;
}

export default function GridSkeleton({ count = 12 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-800" />
        </div>
      ))}
    </div>
  );
}
