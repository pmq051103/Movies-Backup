import axios from "axios";

/* ------------------------------------------------------------------ */
/* Admin API client — talks to the Vercel serverless admin functions.  */
/*                                                                     */
/* Endpoints avoid the `/api` prefix (see vercel.json rewrites) so the */
/* `/api/*` → phimapi.com rewrite never swallows them.                 */
/* ------------------------------------------------------------------ */

const LOGIN_ENDPOINT = "/admin-login";
const ME_ENDPOINT = "/admin-me";
const LOGOUT_ENDPOINT = "/admin-logout";
const MAINTENANCE_ENDPOINT = "/admin-maintenance";
const ACCOUNT_ENDPOINT = "/admin-account";

export interface AdminUser {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
}

export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: AdminUser;
}

export interface MaintenanceContent {
  enabled: boolean;
  title: string;
  content_html: string;
  updated_at: string | null;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(LOGIN_ENDPOINT, { username, password });
  return data;
}

export async function adminMe(token: string): Promise<AdminUser | null> {
  const { data } = await axios.get<{ user: AdminUser }>(ME_ENDPOINT, {
    headers: authHeader(token),
  });
  return data.user;
}

export async function adminLogout(token: string): Promise<void> {
  await axios.post(LOGOUT_ENDPOINT, {}, { headers: authHeader(token) });
}

export async function fetchMaintenance(): Promise<MaintenanceContent> {
  const { data } = await axios.get<MaintenanceContent>(MAINTENANCE_ENDPOINT);
  return data;
}

export async function saveMaintenance(
  token: string,
  content: { enabled: boolean; title: string; content_html: string },
): Promise<void> {
  await axios.post(MAINTENANCE_ENDPOINT, content, { headers: authHeader(token) });
}

export async function listAdminUsers(token: string): Promise<AdminUser[]> {
  const { data } = await axios.get<{ users: AdminUser[] }>(ACCOUNT_ENDPOINT, {
    headers: authHeader(token),
  });
  return data.users;
}

export async function createAdminUser(
  token: string,
  opts: { username: string; password: string; display_name?: string },
): Promise<void> {
  await axios.post(ACCOUNT_ENDPOINT, opts, { headers: authHeader(token) });
}

export const adminService = {
  login: adminLogin,
  me: adminMe,
  logout: adminLogout,
  fetchMaintenance,
  saveMaintenance,
  listUsers: listAdminUsers,
  createUser: createAdminUser,
};

export default adminService;
