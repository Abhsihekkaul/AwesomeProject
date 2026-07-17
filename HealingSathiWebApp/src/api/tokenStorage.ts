// Same interface as the RN app's tokenStorage (AsyncStorage there, localStorage
// here) — kept async so http.ts ports over without a single line changing.
// SSR-safe: on the server there is no window, so every call answers null/no-op.

const ACCESS_TOKEN_KEY = "healingsathi:accessToken";
const REFRESH_TOKEN_KEY = "healingsathi:refreshToken";

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

export const tokenStorage = {
  getAccessToken: async () => storage()?.getItem(ACCESS_TOKEN_KEY) ?? null,
  getRefreshToken: async () => storage()?.getItem(REFRESH_TOKEN_KEY) ?? null,

  setTokens: async (accessToken: string, refreshToken: string) => {
    storage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage()?.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: async () => {
    storage()?.removeItem(ACCESS_TOKEN_KEY);
    storage()?.removeItem(REFRESH_TOKEN_KEY);
  },
};
