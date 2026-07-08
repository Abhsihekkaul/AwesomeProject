export const groupsTypeDefs = /* GraphQL */ `
  enum GroupStatus {
    Active
    PendingReview
  }

  enum GroupRole {
    Member
    Moderator
    Contributor
    Admin
  }

  enum GroupProposalStatus {
    Pending
    Approved
    Rejected
  }

  type Group {
    id: ID!
    name: String!
    description: String!
    category: String!
    accentColor: String!
    status: GroupStatus!
    createdBy: User!
    memberCount: Int!
    isJoined: Boolean!
    myRole: GroupRole
    createdAt: DateTime!
  }

  type GroupMember {
    id: ID!
    user: User!
    role: GroupRole!
    joinedAt: DateTime!
  }

  type GroupProposal {
    id: ID!
    requestedBy: User!
    conditionName: String!
    briefDescription: String!
    estimatedPopulation: String
    whyNeeded: String!
    medicalReferences: String
    status: GroupProposalStatus!
    createdAt: DateTime!
  }

  input ProposeGroupInput {
    conditionName: String!
    briefDescription: String!
    estimatedPopulation: String
    whyNeeded: String!
    medicalReferences: String
  }

  extend type Query {
    groups(category: String): [Group!]!
    group(id: ID!): Group
    groupMembers(groupId: ID!): [GroupMember!]!
  }

  extend type Mutation {
    proposeGroup(input: ProposeGroupInput!): GroupProposal!
    joinGroup(groupId: ID!): Group!
    leaveGroup(groupId: ID!): Group!
  }
`;
