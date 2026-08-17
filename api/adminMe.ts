import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* Admin session check — GET /admin-me                                */
/* Authorization: Bearer <token>                                      */
/* Returns: { user } on success, 401 otherwise.                       */
/* ------------------------------------------------------------------ */

interface VerifyResult {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
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
    const user = await rpc<VerifyResult | null>("admin_verify", { p_token: token });
    if (!user) {
      res.status(401).json({ error: "invalid or expired session" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ user });
  } catch (err) {
    console.error("[adminMe] failed:", err);
    res.status(502).json({ error: "verify failed" });
  }
}