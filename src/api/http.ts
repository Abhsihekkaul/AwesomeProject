import axios, { AxiosError } from "axios";
import { API_URL } from "./config";
import { tokenStorage } from "./tokenStorage";

/**
 * The app's single axios instance.
 *  - attaches the access token to every request
 *  - on a 401, transparently refreshes the token pair once and retries the request
 *  - if refresh fails, tokens are cleared and the caller sees the original 401
 */
export const http = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

http.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh round-trip. */
const refreshTokens = async (): Promise<boolean> => {
  refreshing ??= (async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      // Plain axios (not `http`) so a failing refresh can't recurse through the interceptor.
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      await tokenStorage.clearTokens();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

  if (error.response?.status === 401 && original && !original._retried) {
    original._retried = true;
    if (await refreshTokens()) return http(original);
  }
  throw error;
});

/** Extracts the backend's `{ error }` message, falling back to a friendly default. */
export const apiErrorMessage = (err: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { error?: string } | undefined)?.error;
    if (message) return message;
    if (err.code === "ECONNABORTED" || !err.response) {
      return "Can't reach the server. Is the backend running? (see run.md)";
    }
  }
  return fallback;
};
