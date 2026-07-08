import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { clampFirst } from "../../lib/pagination";
import { NotFoundError, ValidationError } from "../../utils/errors";

const commentInclude = { author: true } satisfies Prisma.CommentInclude;

type ThreadArgs = { postId: string; parentId?: string | null; first: number; after?: string | null };

export const listThread = ({ postId, parentId, first, after }: ThreadArgs) =>
  prisma.comment.findMany({
    where: { postId, parentId: parentId ?? null },
    include: commentInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: clampFirst(first),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
  });

export const replyCount = (commentId: string) =>
  prisma.comment.count({ where: { parentId: commentId } });

export const myVote = async (userId: string | null, commentId: string) => {
  if (!userId) return null;
  const vote = await prisma.commentVote.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
  return vote?.value ?? null;
};

export const createComment = async (
  authorId: string,
  postId: string,
  parentId: string | null | undefined,
  text: string,
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError("Post not found");

  let depth = 0;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) throw new NotFoundError("Parent comment not found");
    depth = parent.depth + 1;
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId, authorId, parentId: parentId ?? null, depth, text },
      include: commentInclude,
    }),
    prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);

  return comment;
};

export const voteComment = async (userId: string, commentId: string, value: number) => {
  if (![-1, 0, 1].includes(value)) {
    throw new ValidationError("value must be -1, 0, or 1");
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment not found");

  await prisma.$transaction(async (tx) => {
    if (value === 0) {
      await tx.commentVote.deleteMany({ where: { commentId, userId } });
    } else {
      await tx.commentVote.upsert({
        where: { commentId_userId: { commentId, userId } },
        create: { commentId, userId, value },
        update: { value },
      });
    }

    const agg = await tx.commentVote.aggregate({
      where: { commentId },
      _sum: { value: true },
    });

    await tx.comment.update({
      where: { id: commentId },
      data: { voteCount: agg._sum.value ?? 0 },
    });
  });

  return prisma.comment.findUniqueOrThrow({ where: { id: commentId }, include: commentInclude });
};
