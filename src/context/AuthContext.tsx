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
  /** Passwordless: trades an emailed 6-digit code for a session. */
  signInWithEmailCode: (email: string, code: string) => Promise<void>;
  /** Trades a Google id token (from the native Google button) for a session. */
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Applies a freshly returned user (edit profile / change email) to the session. */
  updateUser: (user: AuthUser) => void;
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

  const signInWithEmailCode = useCallback(async (email: string, code: string) => {
    try {
      const payload = await authApi.verifyEmailCode(email, code);
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not sign in with that code"));
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    try {
      const payload = await authApi.signInWithGoogle(idToken);
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Google sign-in failed"));
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

  const updateUser = useCallback((next: AuthUser) => setUser(next), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      signIn,
      signUp,
      signInWithEmailCode,
      signInWithGoogle,
      signInDemo,
      signOut,
      updateUser,
    }),
    [user, isBootstrapping, signIn, signUp, signInWithEmailCode, signInWithGoogle, signInDemo, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
