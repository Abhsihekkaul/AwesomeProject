import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resourcesApi } from "../api/resourcesApi";
import { timeAgo } from "../utils/timeAgo";

/**
 * One comment thread, shared by CommentsSheet and PostDetailsScreen.
 *
 * The backend stores comments flat (each with an optional parentId); this hook
 * rebuilds the tree for the recursive CommentItem UI. Replies are optimistic —
 * they appear instantly and the server copy reconciles on the next refresh.
 * Signed out (demo) keeps everything local, same as the rest of the app.
 */

export type ThreadedComment = {
  id: string;
  user: string;
  /** Present on live comments — tapping the author opens their public profile. */
  authorId?: string;
  initials: string;
  text: string;
  time: string;
  supportCount: number;
  supportedByMe: boolean;
  replies: ThreadedComment[];
};

type FlatComment = {
  id: string;
  user: string;
  authorId?: string;
  text: string;
  parentId: string | null;
  time: string;
  supportCount?: number;
  supportedByMe?: boolean;
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const buildCommentTree = (flat: FlatComment[]): ThreadedComment[] => {
  const nodes = new Map<string, ThreadedComment>();
  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      user: c.user,
      authorId: c.authorId,
      initials: initialsOf(c.user),
      text: c.text,
      time: timeAgo(c.time),
      supportCount: c.supportCount ?? 0,
      supportedByMe: c.supportedByMe ?? false,
      replies: [],
    });
  }

  const roots: ThreadedComment[] = [];
  for (const c of flat) {
    const parent = c.parentId ? nodes.get(c.parentId) : undefined;
    // A reply whose parent vanished surfaces as top-level rather than disappearing.
    (parent ? parent.replies : roots).push(nodes.get(c.id)!);
  }
  return roots;
};

/** Immutably inserts a node under parentId (or at the top level when absent). */
const insertNode = (
  tree: ThreadedComment[],
  parentId: string | undefined,
  node: ThreadedComment,
): ThreadedComment[] => {
  if (!parentId) return [...tree, node];
  return tree.map((c) =>
    c.id === parentId
      ? { ...c, replies: [...c.replies, node] }
      : { ...c, replies: insertNode(c.replies, parentId, node) },
  );
};

/** Immutably applies a patch to the node with the given id, wherever it sits. */
const patchNode = (
  tree: ThreadedComment[],
  id: string,
  patch: Partial<ThreadedComment>,
): ThreadedComment[] =>
  tree.map((c) =>
    c.id === id ? { ...c, ...patch } : { ...c, replies: patchNode(c.replies, id, patch) },
  );

/** Immutably removes a node (its nested replies go with it) wherever it sits. */
const removeNode = (tree: ThreadedComment[], id: string): ThreadedComment[] =>
  tree
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeNode(c.replies, id) }));

const findNode = (tree: ThreadedComment[], id: string): ThreadedComment | undefined => {
  for (const c of tree) {
    if (c.id === id) return c;
    const hit = findNode(c.replies, id);
    if (hit) return hit;
  }
  return undefined;
};

export function useComments(postId: string | undefined, demoThread: ThreadedComment[]) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<ThreadedComment[]>(demoThread);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !postId) return;
    try {
      const { comments: flat } = await resourcesApi.getPost(postId);
      setComments(buildCommentTree(flat));
      setIsLive(true);
    } catch {
      // Demo post id or offline backend — keep whatever thread is showing.
    }
  }, [isAuthenticated, postId]);

  const addComment = useCallback(
    (text: string, parentId?: string) => {
      const name = user?.name ?? "You";
      setComments((prev) =>
        insertNode(prev, parentId, {
          id: `local-${Date.now()}`,
          user: name,
          initials: isAuthenticated ? initialsOf(name) : "ME",
          text,
          time: "now",
          supportCount: 0,
          supportedByMe: false,
          replies: [],
        }),
      );

      if (isLive && postId) {
        resourcesApi
          .addComment(postId, text, parentId)
          .then(refresh) // swap the optimistic node for the server's copy
          .catch(() => {});
      }
    },
    [isAuthenticated, isLive, postId, refresh, user?.name],
  );

  /** ♥ on a comment: flips instantly, then the server's authoritative count lands. */
  const toggleSupport = useCallback(
    (commentId: string) => {
      setComments((prev) => {
        const current = findNode(prev, commentId);
        if (!current) return prev;
        return patchNode(prev, commentId, {
          supportedByMe: !current.supportedByMe,
          supportCount: current.supportCount + (current.supportedByMe ? -1 : 1),
        });
      });

      if (isLive && postId && !commentId.startsWith("local-")) {
        resourcesApi
          .reactToComment(postId, commentId)
          .then(({ active, supportCount }) =>
            setComments((prev) =>
              patchNode(prev, commentId, { supportedByMe: active, supportCount }),
            ),
          )
          .catch(() => {});
      }
    },
    [isLive, postId],
  );

  /** Deletes a comment (the branch under it goes too — server does the same). */
  const removeComment = useCallback(
    (commentId: string) => {
      setComments((prev) => removeNode(prev, commentId));
      if (isLive && postId && !commentId.startsWith("local-")) {
        resourcesApi
          .deleteComment(postId, commentId)
          .then(refresh)
          .catch(() => refresh()); // rejected (e.g. not yours) → the real thread comes back
      }
    },
    [isLive, postId, refresh],
  );

  return { comments, isLive, refresh, addComment, toggleSupport, removeComment };
}
