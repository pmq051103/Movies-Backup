import { useEffect, useState, useCallback } from "react";
import { fetchMaintenance, type MaintenanceContent } from "@/api/adminService";

/* ------------------------------------------------------------------ */
/* useMaintenance — loads + caches the public maintenance flag.        */
/*                                                                     */
/* When maintenance is enabled the whole public site is replaced by    */
/* the maintenance page (except /admin). The admin dashboard calls     */
/* `refresh()` after saving so the switch takes effect immediately.    */
/* ------------------------------------------------------------------ */

const CACHE_KEY = "maintenance-cache";
const CACHE_TTL = 60 * 1000; // 1 minute

interface MaintenanceState {
  loading: boolean;
  enabled: boolean;
  title: string;
  contentHtml: string;
  refresh: () => void;
}

function readCache(): { data: MaintenanceContent; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { data: MaintenanceContent; at: number };
  } catch {
    return null;
  }
}

function writeCache(data: MaintenanceContent): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function clearMaintenanceCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function useMaintenance(): MaintenanceState {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");

  const refresh = useCallback(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      setEnabled(cached.data.enabled);
      setTitle(cached.data.title);
      setContentHtml(cached.data.content_html);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMaintenance()
      .then((data) => {
        writeCache(data);
        setEnabled(data.enabled);
        setTitle(data.title);
        setContentHtml(data.content_html);
      })
      .catch(() => {
        /* If the check fails, never lock users out — treat as disabled. */
        setEnabled(false);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, enabled, title, contentHtml, refresh };
}
