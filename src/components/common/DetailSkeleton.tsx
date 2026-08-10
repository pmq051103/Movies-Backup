export default function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Backdrop skeleton */}
      <div className="relative h-[50vh] w-full animate-pulse bg-gray-800 sm:h-[60vh]">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 to-transparent" />
      </div>

      {/* Content area */}
      <div className="relative z-10 mx-auto -mt-32 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster skeleton */}
          <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-64">
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-gray-800" />
          </div>

          {/* Details skeleton */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-800" />

            {/* Meta row (year, rating, runtime) */}
            <div className="flex gap-3">
              <div className="h-5 w-16 animate-pulse rounded bg-gray-800" />
              <div className="h-5 w-12 animate-pulse rounded bg-gray-800" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-800" />
            </div>

            {/* Genre tags */}
            <div className="flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-gray-800" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-gray-800" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-gray-800" />
            </div>

            {/* Overview lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-800" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <div className="h-11 w-32 animate-pulse rounded-lg bg-gray-800" />
              <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-800" />
              <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-800" />
            </div>

            {/* Cast / crew section */}
            <div className="space-y-3 pt-6">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-800" />
              <div className="flex gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 animate-pulse rounded-full bg-gray-800" />
                    <div className="h-3 w-14 animate-pulse rounded bg-gray-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
