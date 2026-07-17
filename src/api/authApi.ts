import { http } from "./http";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  conditions?: string[];
  /** "admin" unlocks the Settings → Admin review queue. */
  role?: "member" | "admin";
  /** Chat notifications toggle — false silences message popups + notification entries. */
  notifyOnMessages?: boolean;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
};

export const authApi = {
  signIn: async (email: string, password: string): Promise<AuthPayload> =>
    (await http.post("/auth/signin", { email, password })).data,

  signUp: async (email: string, password: string, name: string): Promise<AuthPayload> =>
    (await http.post("/auth/signup", { email, password, name })).data,

  me: async (): Promise<ApiUser> => (await http.get("/auth/me")).data.user,

  updateMe: async (patch: {
    name?: string;
    avatarColor?: string;
    conditions?: string[];
    /** Profile photo as a base64 data-URI; null removes it. */
    avatarUrl?: string | null;
    notifyOnMessages?: boolean;
  }): Promise<ApiUser> => (await http.patch("/auth/me", patch)).data.user,

  signOut: async (refreshToken: string | null): Promise<void> => {
    if (refreshToken) await http.post("/auth/signout", { refreshToken });
  },

  // Forgot-password flow. The backend never reveals whether the email exists;
  // in dev builds it returns `devCode` (no email service yet) so the flow is testable.
  forgotPassword: async (email: string): Promise<{ message: string; devCode?: string }> =>
    (await http.post("/auth/forgot-password", { email })).data,

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await http.post("/auth/reset-password", { email, code, newPassword });
  },

  // refreshToken identifies this device's session so it's the one that survives.
  changePassword: async (currentPassword: string, newPassword: string, refreshToken: string | null): Promise<void> => {
    await http.post("/auth/change-password", { currentPassword, newPassword, refreshToken });
  },

  changeEmail: async (newEmail: string, password: string): Promise<ApiUser> =>
    (await http.post("/auth/change-email", { newEmail, password })).data.user,

  // Permanent deletion: password-confirmed; erases the account and all its content
  // server-side. `reason` (preset option) + optional feedback are stored anonymously
  // so the product can learn. The caller clears the local session afterwards.
  deleteAccount: async (password: string, reason: string, feedback?: string): Promise<void> => {
    await http.delete("/auth/me", { data: { password, reason, feedback } });
  },

  // Passwordless sign-in: request a 6-digit code by email, then trade it for a session.
  requestEmailCode: async (email: string): Promise<{ message: string; devCode?: string }> =>
    (await http.post("/auth/email-code/request", { email })).data,

  verifyEmailCode: async (email: string, code: string): Promise<AuthPayload> =>
    (await http.post("/auth/email-code/verify", { email, code })).data,

  // Google sign-in: the app's Google button obtains an id token natively; the backend
  // verifies it and finds-or-creates the account.
  signInWithGoogle: async (idToken: string): Promise<AuthPayload> =>
    (await http.post("/auth/google", { idToken })).data,
};
