"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useComments, type ThreadedComment } from "@/hooks/useComments";
import { cn } from "@/lib/cn";

// Same thread ergonomics as the app: indentation caps so deep talks never walk
// off-screen; deep branches fold behind "View N replies".
const MAX_INDENT_DEPTH = 3;
const AUTO_COLLAPSE_DEPTH = 3;

const DEMO_THREAD: ThreadedComment[] = [
  {
    id: "d1",
    user: "Shivani Rawat",
    initials: "SR",
    text: "This breathing technique completely changed my mornings. Give it a week!",
    time: "2h",
    supportCount: 4,
    supportedByMe: false,
    replies: [
      {
        id: "d1a",
        user: "Arun",
        initials: "A",
        text: "Before or after coffee? Caffeine messes with my heart rate.",
        time: "1h",
        supportCount: 1,
        supportedByMe: false,
        replies: [],
      },
    ],
  },
];

const countReplies = (c: ThreadedComment): number =>
  c.replies.reduce((sum, r) => sum + 1 + countReplies(r), 0);

function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onReply,
  onSupport,
  onDelete,
}: {
  comment: ThreadedComment;
  depth?: number;
  currentUserId?: string;
  onReply: (c: ThreadedComment) => void;
  onSupport: (id: string) => void;
  onDelete: (c: ThreadedComment) => void;
}) {
  const [collapsed, setCollapsed] = useState(
    depth >= AUTO_COLLAPSE_DEPTH && comment.replies.length > 0,
  );
  const replyCount = countReplies(comment);
  const mine = !!comment.authorId && comment.authorId === currentUserId;

  return (
    <div
      className={cn(
        "mt-3",
        depth > 0 && "border-l-2 border-line pl-3",
        depth > 0 && depth <= MAX_INDENT_DEPTH && "ml-4",
      )}
    >
      <div className="flex items-center gap-2">
        {comment.authorId ? (
          <Link href={`/user/${comment.authorId}`} className="flex items-center gap-2 hover:underline">
            <UserAvatar name={comment.user} size={26} />
            <span className="text-step font-semibold text-ink">{comment.user}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-2">
            <UserAvatar name={comment.user} size={26} />
            <span className="text-step font-semibold text-ink">{comment.user}</span>
          </span>
        )}
        <span className="text-caption text-muted">• {comment.time}</span>
      </div>
      <p className="mt-1 text-step leading-relaxed text-ink">{comment.text}</p>
      <div className="mt-1.5 flex items-center gap-4 text-caption font-semibold">
        <button
          onClick={() => onSupport(comment.id)}
          className={comment.supportedByMe ? "text-danger" : "text-muted hover:text-ink"}
        >
          ♥ {comment.supportCount > 0 ? `${comment.supportCount} ` : ""}Support
        </button>
        <button onClick={() => onReply(comment)} className="text-muted hover:text-ink">
          Reply
        </button>
        {mine ? (
          <button onClick={() => onDelete(comment)} className="text-danger hover:opacity-80">
            Delete
          </button>
        ) : null}
        {replyCount > 0 ? (
          <button onClick={() => setCollapsed((c) => !c)} className="text-primary">
            {collapsed ? `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Hide replies"}
          </button>
        ) : null}
      </div>

      {!collapsed &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            currentUserId={currentUserId}
            onReply={onReply}
            onSupport={onSupport}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

/**
 * The full threaded conversation under a post (the app's CommentsSheet +
 * PostDetails thread, inline like Facebook): replies at any depth, ♥ support,
 * delete-own with cascade, "Replying to" banner on the composer.
 */
export default function CommentThread({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { comments, refresh, addComment, toggleSupport, removeComment } = useComments(
    postId,
    DEMO_THREAD,
  );
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ThreadedComment | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addComment(text, replyTo?.id);
    setDraft("");
    setReplyTo(null);
  };

  const confirmDelete = (comment: ThreadedComment) => {
    const warning =
      comment.replies.length > 0
        ? "Delete this comment? The replies under it are removed too."
        : "Delete this comment? This can't be undone.";
    if (window.confirm(warning)) removeComment(comment.id);
  };

  return (
    <section>
      <h2 className="text-body font-bold text-ink">Conversation</h2>
      {comments.length === 0 ? (
        <p className="mt-3 text-step text-muted">No comments yet — start the conversation.</p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.id}
            onReply={setReplyTo}
            onSupport={toggleSupport}
            onDelete={confirmDelete}
          />
        ))
      )}

      {replyTo ? (
        <div className="mt-4 flex items-center justify-between rounded-t-xl bg-light-purple px-3 py-1.5">
          <span className="text-caption font-semibold text-primary">Replying to {replyTo.user}</span>
          <button onClick={() => setReplyTo(null)} className="text-caption font-bold text-primary">
            ✕
          </button>
        </div>
      ) : null}
      <form onSubmit={submit} className={cn("flex gap-2", replyTo ? "mt-0" : "mt-4")}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo.user}...` : "Add a comment..."}
          className="flex-1 rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-step font-semibold text-white disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </section>
  );
}
