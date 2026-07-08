export const chatTypeDefs = /* GraphQL */ `
  type Conversation {
    id: ID!
    participants: [User!]!
    lastMessage: Message
    unreadCount: Int!
    createdAt: DateTime!
  }

  type Message {
    id: ID!
    conversation: Conversation!
    sender: User!
    text: String!
    attachmentUrl: String
    createdAt: DateTime!
  }

  extend type Query {
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation
    messages(conversationId: ID!, first: Int = 30, before: String): [Message!]!
  }

  extend type Mutation {
    startConversation(userId: ID!): Conversation!
    "Real-time delivery goes over Socket.io (message:send); this mutation is the REST/offline-safe fallback."
    sendMessage(conversationId: ID!, text: String!, attachmentUrl: String): Message!
    markConversationRead(conversationId: ID!): Conversation!
  }
`;
