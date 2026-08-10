import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

/**
 * Secondary API client — vsmov.com. Kept intentionally minimal (no
 * interceptors, no retries) because we only use it as a supplemental
 * source alongside the primary phimapi. Errors bubble up and callers
 * merge/fallback silently rather than showing a hard error.
 */
export const vsmovClient: AxiosInstance = axios.create({
  baseURL: '/api2',
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

vsmovClient.interceptors.response.use((r) => r.data);

export async function vsmovGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return vsmovClient.get(url, config) as unknown as Promise<T>;
}

export default vsmovClient;
