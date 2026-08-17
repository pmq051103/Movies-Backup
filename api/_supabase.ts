/* ------------------------------------------------------------------ */
/* Shared Supabase RPC helper for the admin serverless functions.      */
/*                                                                     */
/* Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY                        */
/* ------------------------------------------------------------------ */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function configured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/** Call a PostgREST RPC and return the parsed JSON body. */
export async function rpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`supabase rpc ${fn} failed: ${res.status} ${text}`);
  }

  // SQL functions declared `returns void` (e.g. set_maintenance,
  // admin_logout, track_event) make PostgREST respond with an empty
  // body (200/204, no content) — `res.json()` on "" throws "Unexpected
  // end of JSON input". Parse manually so void RPCs resolve to
  // `undefined` instead of crashing every caller that awaits them.
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/** Read the Bearer token from an Authorization header. */
export function bearerToken(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const raw = req.headers["authorization"] ?? req.headers["Authorization"];
  if (typeof raw !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1] : null;
}
