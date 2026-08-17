import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* Admin logout — POST /admin-logout                                  */
/* Authorization: Bearer <token> — revokes the session.               */
/* ------------------------------------------------------------------ */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!configured()) {
    res.status(500).json({ error: "supabase env not configured" });
    return;
  }

  const raw = req.headers["authorization"] ?? req.headers["Authorization"];
  const token = typeof raw === "string" ? /^Bearer\s+(.+)$/i.exec(raw.trim())?.[1] : null;
  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }

  try {
    await rpc("admin_logout", { p_token: token });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[adminLogout] failed:", err);
    res.status(502).json({ error: "logout failed" });
  }
}