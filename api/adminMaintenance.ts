import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc, bearerToken } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* Maintenance content — public read, admin write.                     */
/*                                                                     */
/*   GET /admin-maintenance   (public) → { enabled, title,             */
/*                                        content_html, updated_at }   */
/*   POST /admin-maintenance  (admin, Bearer token)                    */
/*     Body: { enabled, title, content_html }                          */
/*                                                                     */
/* GET must stay public so the frontend can render the maintenance     */
/* page to every visitor. POST requires a valid admin session.         */
/* ------------------------------------------------------------------ */

interface Maintenance {
  enabled: boolean;
  title: string;
  content_html: string;
  updated_at: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!configured()) {
    // Distinguish exactly which env var is missing — much faster to
    // diagnose on Vercel than a blanket "not configured" message.
    const missing: string[] = [];
    if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    res.status(500).json({ error: "supabase env not configured", missing });
    return;
  }

  if (req.method === "GET") {
    try {
      const data = await rpc<Maintenance>("get_maintenance", {});
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (err) {
      console.error("[adminMaintenance GET] failed:", err);
      // Surface the real underlying error (e.g. the exact Supabase/
      // PostgREST response) instead of a generic message — this
      // endpoint is public-read anyway, and a vague 502 with no detail
      // is nearly impossible to debug from the browser alone.
      res.status(502).json({
        error: "failed to load maintenance",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  if (req.method === "POST") {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: "missing token" });
      return;
    }

    try {
      const user = await rpc<{ id: number } | null>("admin_verify", { p_token: token });
      if (!user) {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }

      const { enabled, title, content_html } = (req.body ?? {}) as {
        enabled?: boolean;
        title?: string;
        content_html?: string;
      };

      await rpc("set_maintenance", {
        p_enabled: Boolean(enabled),
        p_title: title ?? "",
        p_content_html: content_html ?? "",
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[adminMaintenance POST] failed:", err);
      res.status(502).json({
        error: "failed to save maintenance",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}