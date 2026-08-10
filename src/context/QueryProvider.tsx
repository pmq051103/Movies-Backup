import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Creates a `QueryClient` configured with sensible defaults for a
 * content-driven movie streaming app:
 *  - staleTime: 5 minutes (data is considered fresh for this long)
 *  - gcTime: 30 minutes (unused cache entries are garbage collected after this)
 *  - retry: 2 (failed queries are retried twice before surfacing an error)
 *  - refetchOnWindowFocus: false (avoid refetching on every tab focus)
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Wraps the application with a React Query `QueryClientProvider`.
 * The `QueryClient` instance is created once per component lifetime via
 * `useState` so it survives re-renders but is still safely scoped
 * (e.g. re-created per test / per Storybook story) rather than module-global.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default QueryProvider;
