export const authTypeDefs = /* GraphQL */ `
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  extend type Mutation {
    signUp(email: String!, password: String!, name: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    refreshAccessToken(refreshToken: String!): AuthPayload!

    "Not implemented yet: requires a GOOGLE_CLIENT_ID to verify the id token server-side."
    signInWithGoogle(idToken: String!): AuthPayload!

    "Not implemented yet: requires an APPLE_CLIENT_ID to verify the id token server-side."
    signInWithApple(idToken: String!): AuthPayload!
  }
`;
