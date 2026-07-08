import { GraphQLContext, requireUserId } from "../context";
import * as chatService from "../../modules/chat/service";

type ConversationParent = { id: string };

export const chatResolvers = {
  Query: {
    conversations: (_root: unknown, _args: unknown, ctx: GraphQLContext) =>
      chatService.listConversations(requireUserId(ctx)),

    conversation: (_root: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      chatService.getConversationById(requireUserId(ctx), id),

    messages: (
      _root: unknown,
      { conversationId, first, before }: { conversationId: string; first: number; before?: string | null },
      ctx: GraphQLContext,
    ) => chatService.listMessages(requireUserId(ctx), conversationId, first, before),
  },
  Mutation: {
    startConversation: (_root: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      chatService.startConversation(requireUserId(ctx), userId),

    sendMessage: (
      _root: unknown,
      { conversationId, text, attachmentUrl }: { conversationId: string; text: string; attachmentUrl?: string | null },
      ctx: GraphQLContext,
    ) => chatService.sendMessage(requireUserId(ctx), conversationId, text, attachmentUrl),

    markConversationRead: (
      _root: unknown,
      { conversationId }: { conversationId: string },
      ctx: GraphQLContext,
    ) => chatService.markConversationRead(requireUserId(ctx), conversationId),
  },
  Conversation: {
    participants: (parent: { participants: { user: unknown }[] }) =>
      parent.participants.map((p) => p.user),
    lastMessage: (parent: ConversationParent) => chatService.getLastMessage(parent.id),
    unreadCount: (parent: ConversationParent, _args: unknown, ctx: GraphQLContext) =>
      ctx.userId ? chatService.getUnreadCount(ctx.userId, parent.id) : 0,
  },
};
