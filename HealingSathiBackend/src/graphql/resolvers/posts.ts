import { GraphQLContext, requireUserId } from "../context";
import * as postsService from "../../modules/posts/service";

type PostParent = { id: string };
type PaginationArgs = { first: number; after?: string | null };

export const postsResolvers = {
  Query: {
    feed: (_root: unknown, args: { groupId?: string | null } & PaginationArgs) =>
      postsService.listFeed(args),
    post: (_root: unknown, { id }: { id: string }) => postsService.getPostById(id),
  },
  Mutation: {
    createPost: (
      _root: unknown,
      { input }: { input: postsService.CreatePostInput },
      ctx: GraphQLContext,
    ) => postsService.createPost(requireUserId(ctx), input),

    reactToPost: (
      _root: unknown,
      { postId, type }: { postId: string; type: "Support" | "Helpful" },
      ctx: GraphQLContext,
    ) => postsService.reactToPost(requireUserId(ctx), postId, type),

    removeReaction: (
      _root: unknown,
      { postId, type }: { postId: string; type: "Support" | "Helpful" },
      ctx: GraphQLContext,
    ) => postsService.removeReaction(requireUserId(ctx), postId, type),

    sharePost: (_root: unknown, { postId }: { postId: string }, ctx: GraphQLContext) =>
      postsService.sharePost(requireUserId(ctx), postId),
  },
  Post: {
    myReactions: (parent: PostParent, _args: unknown, ctx: GraphQLContext) =>
      postsService.myReactionsForPost(ctx.userId, parent.id),
  },
  Group: {
    posts: (parent: PostParent, args: PaginationArgs) =>
      postsService.listFeed({ groupId: parent.id, ...args }),
  },
  User: {
    posts: (parent: PostParent, args: PaginationArgs) =>
      postsService.listFeed({ authorId: parent.id, ...args }),
  },
};
