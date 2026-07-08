import { rootTypeDefs } from "./schema/root";
import { scalarsTypeDefs, DateTimeScalar } from "./schema/scalars";
import { usersTypeDefs } from "./schema/users";
import { authTypeDefs } from "./schema/auth";
import { groupsTypeDefs } from "./schema/groups";
import { postsTypeDefs } from "./schema/posts";
import { commentsTypeDefs } from "./schema/comments";
import { chatTypeDefs } from "./schema/chat";
import { bookingTypeDefs } from "./schema/booking";
import { notificationsTypeDefs } from "./schema/notifications";

import { usersResolvers } from "./resolvers/users";
import { authResolvers } from "./resolvers/auth";
import { groupsResolvers } from "./resolvers/groups";
import { postsResolvers } from "./resolvers/posts";
import { commentsResolvers } from "./resolvers/comments";
import { chatResolvers } from "./resolvers/chat";
import { bookingResolvers } from "./resolvers/booking";
import { notificationsResolvers } from "./resolvers/notifications";
import { mergeResolvers } from "./mergeResolvers";

export const schema = [
  rootTypeDefs,
  scalarsTypeDefs,
  usersTypeDefs,
  authTypeDefs,
  groupsTypeDefs,
  postsTypeDefs,
  commentsTypeDefs,
  chatTypeDefs,
  bookingTypeDefs,
  notificationsTypeDefs,
].join("\n");

export const resolvers = {
  DateTime: DateTimeScalar,
  ...mergeResolvers(
    usersResolvers,
    authResolvers,
    groupsResolvers,
    postsResolvers,
    commentsResolvers,
    chatResolvers,
    bookingResolvers,
    notificationsResolvers,
  ),
};
