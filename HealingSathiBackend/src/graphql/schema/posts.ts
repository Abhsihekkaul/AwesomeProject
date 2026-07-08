export const postsTypeDefs = /* GraphQL */ `
  enum PostReactionType {
    Support
    Helpful
  }

  type Post {
    id: ID!
    author: User!
    group: Group
    title: String
    body: String!
    tags: [String!]!
    contentWarning: Boolean!
    images: [String!]!
    videoUrl: String
    supportCount: Int!
    helpfulCount: Int!
    commentCount: Int!
    shareCount: Int!
    myReactions: [PostReactionType!]!
    createdAt: DateTime!
  }

  input CreatePostInput {
    groupId: ID
    title: String
    body: String!
    tags: [String!]
    contentWarning: Boolean
    images: [String!]
    videoUrl: String
  }

  extend type Query {
    feed(groupId: ID, first: Int = 20, after: String): [Post!]!
    post(id: ID!): Post
  }

  extend type Mutation {
    createPost(input: CreatePostInput!): Post!
    reactToPost(postId: ID!, type: PostReactionType!): Post!
    removeReaction(postId: ID!, type: PostReactionType!): Post!
    sharePost(postId: ID!): Post!
  }

  extend type Group {
    posts(first: Int = 20, after: String): [Post!]!
  }

  extend type User {
    posts(first: Int = 20, after: String): [Post!]!
  }
`;
