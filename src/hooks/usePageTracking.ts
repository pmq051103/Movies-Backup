import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/api/trackService";

/* ------------------------------------------------------------------ */
/* usePageTracking — fires a pageview event on every route change.     */
/*                                                                     */
/* Mounted once in MainLayout so ANY navigation (link click, browser   */
/* back/forward, typing a URL, or landing from Google Chrome search)   */
/* is recorded with the current path + referrer.                       */
/*                                                                     */
/* React <StrictMode> double-invokes effects in dev (mount → unmount   */
/* → mount), which would otherwise send two pageviews on one load.     */
/* We dedupe identical path within a short window to send exactly one. */
/* ------------------------------------------------------------------ */

const DEDUPE_MS = 800;

export function usePageTracking(): void {
  const { pathname, search } = useLocation();
  const lastRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    const path = pathname + search;
    const now = Date.now();
    const last = lastRef.current;

    if (last && last.path === path && now - last.at < DEDUPE_MS) {
      return;
    }
    lastRef.current = { path, at: now };

    trackPageView(path, document.referrer);
  }, [pathname, search]);
}

export default usePageTracking;
