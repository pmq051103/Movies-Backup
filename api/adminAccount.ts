import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configured, rpc, bearerToken } from "./_supabase.js";

/* ------------------------------------------------------------------ */
/* Admin accounts management — all require a valid admin session.      */
/*                                                                     */
/*   GET    /admin-account        → list admin users                   */
/*   POST   /admin-account        → create user                        */
/*           Body: { username, password, display_name? }               */
/*   DELETE /admin-account?id=N   → remove user (except owner role)    */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
  active: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!configured()) {
    res.status(500).json({ error: "supabase env not configured" });
    return;
  }

  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }

  try {
    const user = await rpc<AdminUser | null>("admin_verify", { p_token: token });
    if (!user) {
      res.status(401).json({ error: "invalid or expired session" });
      return;
    }
  } catch (err) {
    console.error("[adminAccount verify] failed:", err);
    res.status(502).json({ error: "verify failed" });
    return;
  }

  try {
    if (req.method === "GET") {
      const users = await rpc<AdminUser[]>("list_admin_users", {});
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ users });
      return;
    }

    if (req.method === "POST") {
      const { username, password, display_name } = (req.body ?? {}) as {
        username?: string;
        password?: string;
        display_name?: string;
      };
      if (!username || !password) {
        res.status(400).json({ error: "username and password required" });
        return;
      }
      const result = await rpc<{ ok: boolean; error?: string }>("create_admin_user", {
        p_username: username,
        p_password: password,
        p_display_name: display_name ?? null,
      });
      if (!result.ok) {
        res.status(400).json({ error: result.error ?? "create failed" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id ?? req.query["id"]);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "invalid id" });
        return;
      }
      await rpc("delete_admin_user", { p_id: id });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("[adminAccount] failed:", err);
    res.status(502).json({ error: "operation failed" });
  }
}