import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* GET /stats?days=7                                                   */
/* Thin wrapper around the `get_stats` Postgres function (see           */
/* supabase/schema.sql) — returns everything the /admin dashboard's     */
/* StatsDashboard needs in one call.                                    */
/* ------------------------------------------------------------------ */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!configured()) {
    res.status(500).json({ error: "supabase env not configured" });
    return;
  }

  const rawDays = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
  const days = Number(rawDays) > 0 ? Number(rawDays) : 7;

  try {
    const result = await rpc("get_stats", { days });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (err) {
    console.error("[stats] failed:", err);
    res.status(502).json({ error: "failed to load stats" });
  }
}
