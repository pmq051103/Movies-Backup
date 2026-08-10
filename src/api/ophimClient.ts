import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

/**
 * Tertiary API client — ophim1.com. Same idea as `vsmovClient`: a thin,
 * interceptor-free client used only as a supplemental source. Errors
 * bubble up and callers in `dualSource.ts` merge/fallback silently
 * rather than showing a hard error.
 *
 * ophim1.com's public API only confirms two endpoints (listing +
 * detail) — no documented keyword-search endpoint — so this client is
 * wired into the "latest movies" feed and movie-detail fallback, but
 * NOT into search. See dualSource.ts for where it's actually used.
 */
export const ophimClient: AxiosInstance = axios.create({
  baseURL: '/api3',
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

ophimClient.interceptors.response.use((r) => r.data);

export async function ophimGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return ophimClient.get(url, config) as unknown as Promise<T>;
}

export default ophimClient;
