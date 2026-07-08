import { GraphQLContext, requireUserId } from "../context";
import * as commentsService from "../../modules/comments/service";

type CommentParent = { id: string; postId: string };
type PostParent = { id: string };
type PaginationArgs = { first: number; after?: string | null };

export const commentsResolvers = {
  Mutation: {
    createComment: (
      _root: unknown,
      { postId, parentId, text }: { postId: string; parentId?: string | null; text: string },
      ctx: GraphQLContext,
    ) => commentsService.createComment(requireUserId(ctx), postId, parentId, text),

    voteComment: (
      _root: unknown,
      { commentId, value }: { commentId: string; value: number },
      ctx: GraphQLContext,
    ) => commentsService.voteComment(requireUserId(ctx), commentId, value),
  },
  Post: {
    comments: (parent: PostParent, args: PaginationArgs) =>
      commentsService.listThread({ postId: parent.id, parentId: null, ...args }),
  },
  Comment: {
    replyCount: (parent: CommentParent) => commentsService.replyCount(parent.id),
    myVote: (parent: CommentParent, _args: unknown, ctx: GraphQLContext) =>
      commentsService.myVote(ctx.userId, parent.id),
    replies: (parent: CommentParent, args: PaginationArgs) =>
      commentsService.listThread({ postId: parent.postId, parentId: parent.id, ...args }),
  },
};
