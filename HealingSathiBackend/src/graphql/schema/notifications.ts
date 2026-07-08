export const notificationsTypeDefs = /* GraphQL */ `
  enum NotificationType {
    Groups
    Chats
    System
    Booking
  }

  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    deepLinkType: String
    deepLinkId: String
    read: Boolean!
    createdAt: DateTime!
  }

  extend type Query {
    notifications(first: Int = 30, after: String): [Notification!]!
    unreadNotificationCount: Int!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!
  }
`;
