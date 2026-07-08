export const usersTypeDefs = /* GraphQL */ `
  enum ConditionCategory {
    DiabetesMetabolic
    Cardiovascular
    MentalHealth
    Neurological
    Autoimmune
    Digestive
    Respiratory
    PainChronic
    EndocrineHormonal
    KidneyUrinary
    Cancer
    Skin
    RareOther
  }

  type Condition {
    id: ID!
    name: String!
    category: ConditionCategory!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    avatarColor: String!
    avatarUrl: String
    bio: String
    publicProfile: Boolean!
    showConditions: Boolean!
    anonymousPosts: Boolean!
    analyticsOptIn: Boolean!
    researchOptIn: Boolean!
    notifyGroupActivity: Boolean!
    notifyReplies: Boolean!
    notifyMatches: Boolean!
    notifyConsultants: Boolean!
    conditions: [Condition!]!
    createdAt: DateTime!
  }

  input UpdateProfileInput {
    name: String
    bio: String
    avatarColor: String
    avatarUrl: String
    publicProfile: Boolean
    showConditions: Boolean
    anonymousPosts: Boolean
    analyticsOptIn: Boolean
    researchOptIn: Boolean
    notifyGroupActivity: Boolean
    notifyReplies: Boolean
    notifyMatches: Boolean
    notifyConsultants: Boolean
    conditionNames: [String!]
  }

  extend type Query {
    me: User
    conditions: [Condition!]!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
  }
`;
