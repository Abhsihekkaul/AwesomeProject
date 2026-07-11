import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, ApiUser } from "../api/authApi";
import { apiErrorMessage } from "../api/http";
import { tokenStorage } from "../api/tokenStorage";

export type AuthUser = ApiUser;

// Seeded via HealingSathiBackend (`npm run seed`) — lets the app be explored end-to-end
// against the real backend without typing anything.
export const DEMO_CREDENTIALS = { email: "patient@healingsathi.dev", password: "password123" };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Session restore on app launch. If the backend is unreachable (offline demo mode),
  // tokens are cleared and the app simply starts signed-out — never blocks the demo.
  useEffect(() => {
    const restoreSession = async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        setUser(await authApi.me());
      } catch {
        await tokenStorage.clearTokens();
      } finally {
        setIsBootstrapping(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const payload = await authApi.signIn(email, password);
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not sign in"));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const payload = await authApi.signUp(email, password, name);
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not create account"));
    }
  }, []);

  const signInDemo = useCallback(
    () => signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password),
    [signIn],
  );

  const signOut = useCallback(async () => {
    // Best-effort server-side revocation; local sign-out always succeeds.
    try {
      await authApi.signOut(await tokenStorage.getRefreshToken());
    } catch {
      // Backend offline — fine, local tokens are cleared below.
    }
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      signIn,
      signUp,
      signInDemo,
      signOut,
    }),
    [user, isBootstrapping, signIn, signUp, signInDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
