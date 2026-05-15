/**
 * API Client
 *
 * Features:
 *  - Auth token injection via request interceptor
 *  - Automatic token refresh with concurrent request queuing (no duplicate refreshes)
 *  - Exponential backoff retry on network errors, 5xx, and 429
 *  - Unified error normalization via ApiError
 *  - File upload with progress callback
 *  - Cancellable requests via AbortController
 *  - Raw instance exposed for advanced use cases
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

// ─── Environment config ───────────────────────────────────────────────────────

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 300;

// ─── Module augmentation ──────────────────────────────────────────────────────

declare module "axios" {
  interface InternalAxiosRequestConfig {
    /** Number of retry attempts made so far for this request. */
    _retryCount?: number;
    /**
     * When true, this request bypasses the automatic 401 → token-refresh flow.
     * Set this on the refresh request itself to prevent infinite loops.
     */
    _skipAuthRefresh?: boolean;
  }
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export interface ValidationErrors {
  [field: string]: string[];
}

/**
 * Normalized error thrown by every api.* helper on non-2xx responses.
 * Check helpers like `.isUnauthorized()` avoid spreading magic numbers.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly validationErrors: ValidationErrors | null;
  readonly originalError: AxiosError;

  constructor(
    message: string,
    status: number,
    code: string,
    validationErrors: ValidationErrors | null,
    originalError: AxiosError,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.validationErrors = validationErrors;
    this.originalError = originalError;
    // Ensures instanceof works correctly after transpilation
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  isUnauthorized() {
    return this.status === 401;
  }
  isForbidden() {
    return this.status === 403;
  }
  isNotFound() {
    return this.status === 404;
  }
  isConflict() {
    return this.status === 409;
  }
  isValidation() {
    return this.status === 422;
  }
  isServerError() {
    return this.status >= 500;
  }
  isTimeout() {
    return this.code === "TIMEOUT";
  }
  isNetwork() {
    return this.code === "NETWORK_ERROR";
  }
}

/** Type-guard for catching ApiError in unknown catch blocks. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// ─── Token store ──────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Thin wrapper around localStorage for token management.
 * Swap the implementation here (e.g. to cookies or memory) without touching
 * any other file.
 */
export const tokenStore = {
  getToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(ACCESS_TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (t: string) => localStorage.setItem(REFRESH_TOKEN_KEY, t),
  clearRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  clearAll: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ─── Retry helpers ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: AxiosError, attempt: number): boolean {
  if (attempt >= MAX_RETRIES) return false;
  // No response at all → network/timeout, always retry
  if (!error.response) return true;
  const { status } = error.response;
  // 429 Too Many Requests, any 5xx except 501 Not Implemented
  return status === 429 || (status >= 500 && status !== 501);
}

function retryDelay(attempt: number, error: AxiosError): number {
  // Honour the server's Retry-After header when present
  const retryAfterHeader = error.response?.headers["retry-after"];
  if (retryAfterHeader) return Number(retryAfterHeader) * 1_000;
  // Exponential backoff with jitter: 300ms, 600ms, 1200ms …
  return RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 100;
}

// ─── Token-refresh queue ──────────────────────────────────────────────────────

type RefreshQueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let _isRefreshing = false;
let _refreshQueue: RefreshQueueEntry[] = [];

function flushRefreshQueue(error: unknown, token: string | null) {
  for (const entry of _refreshQueue) {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(token!);
    }
  }
  _refreshQueue = [];
}

async function doTokenRefresh(): Promise<string> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Use a raw axios call to bypass our own interceptors and avoid loops
  const { data } = await axios.post<{ access_token: string }>(
    `${BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
  );

  tokenStore.setToken(data.access_token);
  return data.access_token;
}

// ─── Error normalizer ─────────────────────────────────────────────────────────

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;

  let message: string;
  let code: string;
  let validationErrors: ValidationErrors | null = null;

  if (!error.response) {
    const isTimeout =
      error.code === "ECONNABORTED" || error.code === "ERR_CANCELED";
    message = isTimeout
      ? "Request timed out. Please try again."
      : "Network error. Please check your connection.";
    code = isTimeout ? "TIMEOUT" : "NETWORK_ERROR";
  } else {
    message = String(
      data?.message ??
        data?.error ??
        error.message ??
        "An unexpected error occurred",
    );
    code = String(data?.code ?? `HTTP_${status}`);
    validationErrors = (data?.errors as ValidationErrors) ?? null;
  }

  return new ApiError(message, status, code, validationErrors, error);
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // flip to true when using HttpOnly cookies
});

// ── Request interceptor ────────────────────────────────────────────────────

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach bearer token when available
    const token = tokenStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Initialise retry counter (nullish assignment avoids overwriting on retries)
    config._retryCount ??= 0;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────────────────────

httpClient.interceptors.response.use(
  (response) => response, // pass-through on 2xx
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    if (!config) return Promise.reject(normalizeError(error));

    // ── 401: queue or trigger token refresh ──────────────────────────────
    if (error.response?.status === 401 && !config._skipAuthRefresh) {
      if (_isRefreshing) {
        // Park request until the in-flight refresh completes
        return new Promise<string>((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          return httpClient(config);
        });
      }

      _isRefreshing = true;
      try {
        const newToken = await doTokenRefresh();
        flushRefreshQueue(null, newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(config);
      } catch (refreshError) {
        flushRefreshQueue(refreshError, null);
        tokenStore.clearAll();
        // Let the app react however it needs to (redirect to login, show modal…)
        window.dispatchEvent(new CustomEvent("api:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    // ── Retry on transient errors ─────────────────────────────────────────
    const attempt = config._retryCount ?? 0;
    if (isRetryable(error, attempt)) {
      config._retryCount = attempt + 1;
      await sleep(retryDelay(attempt, error));
      return httpClient(config);
    }

    // ── Normalize and forward ─────────────────────────────────────────────
    return Promise.reject(normalizeError(error));
  },
);

// ─── Typed request helpers ────────────────────────────────────────────────────

export type RequestConfig = Omit<AxiosRequestConfig, "url" | "method">;

/**
 * GET /some/endpoint
 * @example const users = await api.get<User[]>("/users");
 */
async function get<T>(url: string, config?: RequestConfig): Promise<T> {
  const res = await httpClient.get<T>(url, config);
  return res.data;
}

/**
 * POST /some/endpoint
 * @example const user = await api.post<User>("/users", payload);
 */
async function post<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await httpClient.post<T>(url, data, config);
  return res.data;
}

/**
 * PUT /some/endpoint/:id  (full replace)
 * @example await api.put<User>("/users/1", updatedUser);
 */
async function put<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await httpClient.put<T>(url, data, config);
  return res.data;
}

/**
 * PATCH /some/endpoint/:id  (partial update)
 * @example await api.patch<User>("/users/1", { firstName: "Jane" });
 */
async function patch<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await httpClient.patch<T>(url, data, config);
  return res.data;
}

/**
 * DELETE /some/endpoint/:id
 * @example await api.delete("/users/1");
 */
async function del<T = void>(url: string, config?: RequestConfig): Promise<T> {
  const res = await httpClient.delete<T>(url, config);
  return res.data;
}

/**
 * POST multipart/form-data with optional upload progress.
 * @example
 * const form = new FormData();
 * form.append("avatar", file);
 * const updated = await api.upload<User>("/users/1/avatar", form, setUploadPct);
 */
async function upload<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  config?: RequestConfig,
): Promise<T> {
  const res = await httpClient.post<T>(url, formData, {
    ...config,
    headers: { ...config?.headers, "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return res.data;
}

/**
 * Returns the pending request promise AND a cancel function backed by
 * AbortController. Ideal for React `useEffect` cleanup.
 * @example
 * const { request, cancel } = api.cancellable<User[]>("/users");
 * useEffect(() => () => cancel(), []);
 * const users = await request;
 */
function cancellable<T>(url: string, config?: RequestConfig) {
  const controller = new AbortController();
  const request = get<T>(url, { ...config, signal: controller.signal });
  const cancel = (reason?: string) => controller.abort(reason);
  return { request, cancel };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  cancellable,
  /** Raw axios instance — use for edge cases that need full AxiosResponse. */
  instance: httpClient,
} as const;
