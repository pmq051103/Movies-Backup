import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* Admin login — POST /admin-login                                    */
/* Body: { username, password }                                       */
/* Returns: { ok, token, user } on success, 401 otherwise.            */
/* ------------------------------------------------------------------ */

interface LoginResult {
  ok: boolean;
  error?: string;
  token?: string;
  user?: { id: number; username: string; display_name: string | null; role: string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!configured()) {
    res.status(500).json({ error: "supabase env not configured" });
    return;
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  try {
    const result = await rpc<LoginResult>("admin_login", { p_username: username, p_password: password });
    if (!result.ok) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (err) {
    console.error("[adminLogin] failed:", err);
    res.status(502).json({ error: "login failed" });
  }
}