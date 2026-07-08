export const commentsTypeDefs = /* GraphQL */ `
  type Comment {
    id: ID!
    post: Post!
    author: User!
    parentId: ID
    depth: Int!
    text: String!
    voteCount: Int!
    myVote: Int
    replyCount: Int!
    replies(first: Int = 10, after: String): [Comment!]!
    createdAt: DateTime!
  }

  extend type Post {
    comments(first: Int = 10, after: String): [Comment!]!
  }

  extend type Mutation {
    createComment(postId: ID!, parentId: ID, text: String!): Comment!
    "value must be 1 (upvote), -1 (downvote) or 0 (remove your vote)"
    voteComment(commentId: ID!, value: Int!): Comment!
  }
`;
