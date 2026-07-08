import * as authService from "../../modules/auth/service";
import { GraphQLContext } from "../context";

export const authResolvers = {
  Mutation: {
    signUp: (
      _root: unknown,
      { email, password, name }: { email: string; password: string; name: string },
      ctx: GraphQLContext,
    ) => authService.signUp(email, password, name, ctx.ip),

    signIn: (
      _root: unknown,
      { email, password }: { email: string; password: string },
      ctx: GraphQLContext,
    ) => authService.signIn(email, password, ctx.ip),

    refreshAccessToken: (
      _root: unknown,
      { refreshToken }: { refreshToken: string },
      ctx: GraphQLContext,
    ) => authService.refreshAccessToken(refreshToken, ctx.ip),

    signInWithGoogle: (_root: unknown, { idToken }: { idToken: string }) =>
      authService.signInWithGoogle(idToken),

    signInWithApple: (_root: unknown, { idToken }: { idToken: string }) =>
      authService.signInWithApple(idToken),
  },
};
