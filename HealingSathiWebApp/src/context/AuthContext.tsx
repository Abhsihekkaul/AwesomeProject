"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, ApiUser } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";
import { tokenStorage } from "@/api/tokenStorage";

export type AuthUser = ApiUser;

// Same demo contract as the app: signed OUT + demo flag = built-in dummy data
// everywhere; signed IN = real backend data only. The flag survives reloads.
const DEMO_KEY = "healingsathi:demoMode";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  /** "Try the demo" was chosen — the shell renders with dummy data, no account. */
  isDemo: boolean;
  enterDemo: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmailCode: (email: string, code: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Applies a freshly returned user (edit profile / change email) to the session. */
  updateUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Session restore on load — same behavior as the app: unreachable backend or
  // dead tokens simply mean starting signed out, never a blocked UI.
  useEffect(() => {
    const restoreSession = async () => {
      setIsDemo(window.localStorage.getItem(DEMO_KEY) === "1");
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

  const adoptSession = useCallback(
    async (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => {
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      window.localStorage.removeItem(DEMO_KEY);
      setIsDemo(false);
      setUser(payload.user);
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await adoptSession(await authApi.signIn(email, password));
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Could not sign in"));
      }
    },
    [adoptSession],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        await adoptSession(await authApi.signUp(email, password, name));
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Could not create account"));
      }
    },
    [adoptSession],
  );

  const signInWithEmailCode = useCallback(
    async (email: string, code: string) => {
      try {
        await adoptSession(await authApi.verifyEmailCode(email, code));
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Could not sign in with that code"));
      }
    },
    [adoptSession],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      try {
        await adoptSession(await authApi.signInWithGoogle(idToken));
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Google sign-in failed"));
      }
    },
    [adoptSession],
  );

  const enterDemo = useCallback(() => {
    window.localStorage.setItem(DEMO_KEY, "1");
    setIsDemo(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut(await tokenStorage.getRefreshToken());
    } catch {
      // Backend offline — local sign-out still succeeds.
    }
    await tokenStorage.clearTokens();
    window.localStorage.removeItem(DEMO_KEY);
    setIsDemo(false);
    setUser(null);
  }, []);

  const updateUser = useCallback((next: AuthUser) => setUser(next), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      isDemo,
      enterDemo,
      signIn,
      signUp,
      signInWithEmailCode,
      signInWithGoogle,
      signOut,
      updateUser,
    }),
    [user, isBootstrapping, isDemo, enterDemo, signIn, signUp, signInWithEmailCode, signInWithGoogle, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
