import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { clampFirst } from "../../lib/pagination";
import { NotFoundError } from "../../utils/errors";

const postInclude = { author: true, group: true } satisfies Prisma.PostInclude;

type FeedArgs = { groupId?: string | null; authorId?: string | null; first: number; after?: string | null };

export const listFeed = ({ groupId, authorId, first, after }: FeedArgs) =>
  prisma.post.findMany({
    where: {
      ...(groupId ? { groupId } : {}),
      ...(authorId ? { authorId } : {}),
    },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: clampFirst(first),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
  });

export const getPostById = (id: string) =>
  prisma.post.findUnique({ where: { id }, include: postInclude });

export type CreatePostInput = {
  groupId?: string | null;
  title?: string | null;
  body: string;
  tags?: string[] | null;
  contentWarning?: boolean | null;
  images?: string[] | null;
  videoUrl?: string | null;
};

export const createPost = (authorId: string, input: CreatePostInput) =>
  prisma.post.create({
    data: {
      authorId,
      groupId: input.groupId ?? null,
      title: input.title ?? null,
      body: input.body,
      tags: input.tags ?? [],
      contentWarning: input.contentWarning ?? false,
      images: input.images ?? [],
      videoUrl: input.videoUrl ?? null,
    },
    include: postInclude,
  });

const reactionCountField = { Support: "supportCount", Helpful: "helpfulCount" } as const;

export const reactToPost = async (
  userId: string,
  postId: string,
  type: "Support" | "Helpful",
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError("Post not found");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.postReaction.findUnique({
      where: { postId_userId_type: { postId, userId, type } },
    });
    if (existing) return;

    await tx.postReaction.create({ data: { postId, userId, type } });
    await tx.post.update({
      where: { id: postId },
      data: { [reactionCountField[type]]: { increment: 1 } },
    });
  });

  return getPostById(postId);
};

export const removeReaction = async (
  userId: string,
  postId: string,
  type: "Support" | "Helpful",
) => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.postReaction.findUnique({
      where: { postId_userId_type: { postId, userId, type } },
    });
    if (!existing) return;

    await tx.postReaction.delete({ where: { id: existing.id } });
    await tx.post.update({
      where: { id: postId },
      data: { [reactionCountField[type]]: { decrement: 1 } },
    });
  });

  return getPostById(postId);
};

export const sharePost = async (userId: string, postId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError("Post not found");

  await prisma.$transaction([
    prisma.shareEvent.create({ data: { postId, userId } }),
    prisma.post.update({ where: { id: postId }, data: { shareCount: { increment: 1 } } }),
  ]);

  return getPostById(postId);
};

export const myReactionsForPost = (userId: string | null, postId: string) =>
  userId
    ? prisma.postReaction
        .findMany({ where: { postId, userId }, select: { type: true } })
        .then((rows) => rows.map((r) => r.type))
    : Promise.resolve([]);
