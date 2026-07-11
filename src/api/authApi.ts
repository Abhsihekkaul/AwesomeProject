import { http } from "./http";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  conditions?: string[];
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

  updateMe: async (patch: { name?: string; avatarColor?: string; conditions?: string[] }): Promise<ApiUser> =>
    (await http.patch("/auth/me", patch)).data.user,

  signOut: async (refreshToken: string | null): Promise<void> => {
    if (refreshToken) await http.post("/auth/signout", { refreshToken });
  },
};
