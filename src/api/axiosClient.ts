import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, API_TIMEOUT } from "@/constants";
import type { APIErrorCode, APIErrorShape } from "@/types";

/* ------------------------------------------------------------------ */
/* Custom error class                                                 */
/* ------------------------------------------------------------------ */

export class APIError extends Error implements APIErrorShape {
  code: APIErrorCode;
  status?: number;
  originalError?: unknown;

  constructor(shape: APIErrorShape) {
    super(shape.message);
    this.name = "APIError";
    this.code = shape.code;
    this.status = shape.status;
    this.originalError = shape.originalError;
  }
}

function mapErrorToAPIError(error: AxiosError): APIError {
  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    return new APIError({
      code: "TIMEOUT",
      message: "The request timed out. Please try again.",
      originalError: error,
    });
  }

  if (!error.response) {
    return new APIError({
      code: "NETWORK_ERROR",
      message: "Network error. Please check your connection and try again.",
      originalError: error,
    });
  }

  const status = error.response.status;

  if (status === 404) {
    return new APIError({
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
      status,
      originalError: error,
    });
  }

  if (status === 400) {
    return new APIError({
      code: "BAD_REQUEST",
      message: "The request was invalid.",
      status,
      originalError: error,
    });
  }

  if (status >= 500) {
    return new APIError({
      code: "SERVER_ERROR",
      message: "The server encountered an error. Please try again later.",
      status,
      originalError: error,
    });
  }

  return new APIError({
    code: "UNKNOWN",
    message: error.message || "An unknown error occurred.",
    status,
    originalError: error,
  });
}

/* ------------------------------------------------------------------ */
/* Retry configuration                                                */
/* ------------------------------------------------------------------ */

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/** Retry only on network errors, timeouts, or 5xx responses. */
function isRetryable(error: AxiosError): boolean {
  if (!error.response) return true; // network error / timeout
  return error.response.status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* Axios instance                                                     */
/* ------------------------------------------------------------------ */

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {};
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    return config;
  },
  (error: AxiosError) => Promise.reject(mapErrorToAPIError(error)),
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    if (config && isRetryable(error)) {
      config.__retryCount = config.__retryCount ?? 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        await delay(RETRY_DELAY_MS * config.__retryCount);
        return axiosClient(config);
      }
    }

    return Promise.reject(mapErrorToAPIError(error));
  },
);

/**
 * Typed GET helper. The response interceptor above already unwraps
 * `response.data`, so callers receive `T` directly.
 */
export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return axiosClient.get(url, config) as unknown as Promise<T>;
}

export default axiosClient;
