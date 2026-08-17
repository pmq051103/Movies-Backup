import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Fires a page-view event on first mount and every route change —
 * wired once in MainLayout so it covers every entry point (direct
 * link, search engine, in-site navigation) without every page needing
 * to remember to track itself.
 */
export function useAnalyticsTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}
