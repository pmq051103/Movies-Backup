import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/* ------------------------------------------------------------------ */
/* Dev-only mock for /track + /stats (in-memory).                      */
/* On Vercel these map to api/track.ts + api/stats.ts serverless        */
/* functions (see vercel.json). Running `npm run dev` has no functions, */
/* so this middleware makes the dashboard work locally too.            */
/* ------------------------------------------------------------------ */
function devTrackingMock(): Plugin {
  const store: Record<string, number> = {};

  const bump = (key: string, by = 1) => {
    store[key] = (store[key] ?? 0) + by;
    return store[key];
  };

  const sourceOf = (referrer?: string): string => {
    if (!referrer) return "direct";
    try {
      const host = new URL(referrer).hostname.toLowerCase();
      if (host.includes("google.") || host.includes("bing.") || host.includes("duckduckgo."))
        return "search";
      if (host.includes("facebook.") || host.includes("youtube.") || host.includes("instagram."))
        return "social";
      return "external";
    } catch {
      return "external";
    }
  };

  /* If real Supabase credentials are present (local .env), forward to the
     actual DB so localhost behaves exactly like production. Only fall back
     to the in-memory store when they're missing (e.g. preview sandbox). */
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

  /* ---- In-memory admin mock (only when Supabase env is missing) ----
     Mimics api/admin*.ts so the /admin dashboard works in preview. Default
     dev account: admin / admin123 (override password via VITE_ADMIN_PASSWORD).
     A known static token is used so reloads keep the session alive. */
  const ADMIN_DEV_USER = "admin";
  const ADMIN_DEV_PASS = process.env.VITE_ADMIN_PASSWORD || "admin123";
  const ADMIN_DEV_TOKEN = "dev-admin-token";
  const adminStore: Record<string, string> = {};

  /* Forward an admin RPC to real Supabase when creds exist. */
  const forwardAdminRpc = async (
    res: import("node:http").ServerResponse,
    fn: string,
    body: Record<string, unknown>,
  ) => {
    try {
      const upstream = await fetch(`${SUPABASE_URL!}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY!,
          Authorization: `Bearer ${SUPABASE_KEY!}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      res.statusCode = upstream.status;
      res.setHeader("content-type", "application/json");
      res.end(await upstream.text());
    } catch (e) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: String(e) }));
    }
  };

  /* Forward a raw RPC result wrapped in a property, matching the shape
     the serverless api/admin*.ts functions return (e.g. { user }, { users })
     so the dev preview behaves exactly like production. */
  const forwardAdminRpcWrapped = async (
    res: import("node:http").ServerResponse,
    fn: string,
    body: Record<string, unknown>,
    wrapper: string,
  ) => {
    try {
      const upstream = await fetch(`${SUPABASE_URL!}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY!,
          Authorization: `Bearer ${SUPABASE_KEY!}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const raw = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader("content-type", "application/json");
      try {
        res.end(JSON.stringify({ [wrapper]: JSON.parse(raw) }));
      } catch {
        res.end(raw);
      }
    } catch (e) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: String(e) }));
    }
  };

  const readBody = (req: import("node:http").IncomingMessage) =>
    new Promise<string>((resolve) => {
      let body = "";
      req.on("data", (c: Buffer) => (body += c));
      req.on("end", () => resolve(body));
    });

  const getToken = (req: import("node:http").IncomingMessage): string | null => {
    const auth = req.headers["authorization"];
    if (typeof auth !== "string") return null;
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    return m ? m[1] : null;
  };

  return {
    name: "dev-tracking-mock",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];

        /* ---- Admin endpoints (login / me / logout / maintenance / account) ---- */
        if (url.startsWith("/admin-")) {
          const method = req.method ?? "GET";
          const adminPath = url.split("?")[0];

          /* With Supabase env, forward everything to the real RPCs. */
          if (useSupabase) {
            if (adminPath === "/admin-login" && method === "POST") {
              void readBody(req).then((b) =>
                forwardAdminRpc(res, "admin_login", JSON.parse(b || "{}")),
              );
              return;
            }
            if (adminPath === "/admin-me" && method === "GET") {
              void forwardAdminRpcWrapped(res, "admin_verify", { p_token: getToken(req) ?? "" }, "user");
              return;
            }
            if (adminPath === "/admin-logout" && method === "POST") {
              void forwardAdminRpc(res, "admin_logout", { p_token: getToken(req) ?? "" });
              return;
            }
            if (adminPath === "/admin-maintenance") {
              if (method === "GET") {
                void forwardAdminRpc(res, "get_maintenance", {});
              } else if (method === "POST") {
                void readBody(req).then((b) => {
                  const p = JSON.parse(b || "{}");
                  void forwardAdminRpc(res, "set_maintenance", {
                    p_enabled: Boolean(p.enabled),
                    p_title: p.title ?? "",
                    p_content_html: p.content_html ?? "",
                  });
                });
              }
              return;
            }
            if (adminPath === "/admin-account") {
              if (method === "GET") {
                void forwardAdminRpcWrapped(res, "list_admin_users", {}, "users");
              } else if (method === "POST") {
                void readBody(req).then((b) => {
                  const p = JSON.parse(b || "{}");
                  void forwardAdminRpc(res, "create_admin_user", {
                    p_username: p.username,
                    p_password: p.password,
                    p_display_name: p.display_name ?? null,
                  });
                });
              }
              return;
            }
            res.statusCode = 405;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "method not allowed" }));
            return;
          }

          /* In-memory mock (no Supabase env) — preview sandbox. */
          const isAuthed = () => getToken(req) === ADMIN_DEV_TOKEN;
          const json = (code: number, data: unknown) => {
            res.statusCode = code;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(data));
          };

          if (adminPath === "/admin-login" && method === "POST") {
            void readBody(req).then((b) => {
              try {
                const p = JSON.parse(b);
                if (p.username === ADMIN_DEV_USER && p.password === ADMIN_DEV_PASS) {
                  json(200, {
                    ok: true,
                    token: ADMIN_DEV_TOKEN,
                    user: { id: 1, username: ADMIN_DEV_USER, display_name: "Admin", role: "owner" },
                  });
                } else {
                  json(401, { error: "invalid credentials" });
                }
              } catch {
                json(400, { error: "bad payload" });
              }
            });
            return;
          }

          if (adminPath === "/admin-me" && method === "GET") {
            if (isAuthed()) {
              json(200, { user: { id: 1, username: ADMIN_DEV_USER, display_name: "Admin", role: "owner" } });
            } else {
              json(401, { error: "invalid or expired session" });
            }
            return;
          }

          if (adminPath === "/admin-logout" && method === "POST") {
            json(200, { ok: true });
            return;
          }

          if (adminPath === "/admin-maintenance") {
            if (method === "GET") {
              json(200, {
                enabled: adminStore["maintenance:enabled"] === "1",
                title: adminStore["maintenance:title"] ?? "Hệ thống đang bảo trì",
                content_html: adminStore["maintenance:content"] ?? "",
                updated_at: adminStore["maintenance:updated"] ?? null,
              });
            } else if (method === "POST" && isAuthed()) {
              void readBody(req).then((b) => {
                try {
                  const p = JSON.parse(b);
                  adminStore["maintenance:enabled"] = p.enabled ? "1" : "0";
                  adminStore["maintenance:title"] = String(p.title ?? "");
                  adminStore["maintenance:content"] = String(p.content_html ?? "");
                  adminStore["maintenance:updated"] = new Date().toISOString();
                  json(200, { ok: true });
                } catch {
                  json(400, { error: "bad payload" });
                }
              });
            } else {
              json(401, { error: "missing token" });
            }
            return;
          }

          if (adminPath === "/admin-account") {
            if (method === "GET" && isAuthed()) {
              json(200, { users: [{ id: 1, username: ADMIN_DEV_USER, display_name: "Admin", role: "owner", active: true }] });
            } else if (method === "POST" && isAuthed()) {
              void readBody(req).then((b) => {
                try {
                  const p = JSON.parse(b);
                  if (!p.username || !p.password) json(400, { error: "username and password required" });
                  else json(200, { ok: true });
                } catch {
                  json(400, { error: "bad payload" });
                }
              });
            } else {
              json(401, { error: "missing token" });
            }
            return;
          }

          json(405, { error: "method not allowed" });
          return;
        }

        if (useSupabase && (url === "/track" || url === "/stats")) {
          const finish = async (body: string) => {
            const target =
              url === "/track"
                ? `${SUPABASE_URL}/rest/v1/rpc/track_event`
                : `${SUPABASE_URL}/rest/v1/rpc/get_stats`;
            try {
              const upstream = await fetch(target, {
                method: "POST",
                headers: {
                  apikey: SUPABASE_KEY!,
                  Authorization: `Bearer ${SUPABASE_KEY!}`,
                  "content-type": "application/json",
                },
                body,
              });
              res.statusCode = upstream.status;
              res.setHeader("content-type", "application/json");
              res.end(await upstream.text());
            } catch (e) {
              res.statusCode = 502;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ error: String(e) }));
            }
          };

          if (req.method === "POST") {
            let body = "";
            req.on("data", (c: Buffer) => (body += c));
            req.on("end", () => void finish(body));
          } else {
            void finish(
              JSON.stringify({
                days: Number(req.url?.match(/[?&]days=(\d+)/)?.[1] ?? 7),
              }),
            );
          }
          return;
        }

        if (req.method === "POST" && url === "/track") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const p = JSON.parse(body);
              const source = sourceOf(p.referrer);
              const day = new Date().toISOString().slice(0, 10);
              bump("track:total");
              bump(`track:day:${day}`);
              bump(`track:source:${source}`);
              bump(`track:source:day:${source}:${day}`);
              if (p.path) bump(`track:path:${p.path}`);
              if (p.type === "movie") {
                bump("track:movie:total");
                bump(`track:movie:day:${day}`);
                bump(`track:movie:${p.movie ?? p.slug ?? "unknown"}`);
                for (const g of p.genres ?? []) bump(`track:genre:${g}`);
                for (const c of p.countries ?? []) bump(`track:country:${c}`);
              }
            } catch {
              /* ignore malformed */
            }
            res.statusCode = 204;
            res.end();
          });
          return;
        }

        if (req.method === "GET" && url === "/stats") {
          const entries = (k: string) =>
            Object.entries(store)
              .filter(
                ([key]) =>
                  key.startsWith(k) &&
                  !key.slice(k.length).includes(":") &&
                  key.slice(k.length) !== "total",
              )
              .map(([key, v]) => ({ name: key.slice(k.length), value: v }))
              .sort((a, b) => b.value - a.value);

          const days = Number(req.url?.match(/[?&]days=(\d+)/)?.[1] ?? 7);
          const byDay: Array<{ day: string; visits: number }> = [];
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
            byDay.push({ day: d, visits: store[`track:day:${d}`] ?? 0 });
          }

          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              total: store["track:total"] ?? 0,
              today: byDay[byDay.length - 1]?.visits ?? 0,
              movieTotal: store["track:movie:total"] ?? 0,
              bySource: [
                { name: "direct", value: store["track:source:direct"] ?? 0 },
                { name: "search", value: store["track:source:search"] ?? 0 },
                { name: "social", value: store["track:source:social"] ?? 0 },
                { name: "external", value: store["track:source:external"] ?? 0 },
              ].filter((s) => s.value > 0),
              byDay,
              topPaths: entries("track:path:").slice(0, 10),
              topMovies: entries("track:movie:").slice(0, 10),
              topGenres: entries("track:genre:").slice(0, 15),
              topCountries: entries("track:country:").slice(0, 15),
            }),
          );
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devTrackingMock()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['.monkeycode-ai.live'],
    // Triple-API proxy to bypass CORS in dev:
    //   /api    → phimapi.com (primary — large catalog)
    //   /api2   → vsmov.com/api (secondary — fresh Vietnamese titles)
    //   /api3   → ophim1.com (tertiary — extra catalog + earliest updates)
    // In production, vercel.json / netlify.toml mirror these rewrites.
    proxy: {
      "/api2": {
        target: "https://vsmov.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api2/, "/api"),
      },
      "/api3": {
        target: "https://ophim1.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api3/, ""),
      },
      "/api": {
        target: "https://phimapi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    port: 3000,
    allowedHosts: ['.monkeycode-ai.live'],
    proxy: {
      "/api2": {
        target: "https://vsmov.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api2/, "/api"),
      },
      "/api3": {
        target: "https://ophim1.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api3/, ""),
      },
      "/api": {
        target: "https://phimapi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
