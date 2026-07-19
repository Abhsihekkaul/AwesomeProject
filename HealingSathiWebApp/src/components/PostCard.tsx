"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import ImageCarousel from "@/components/ImageCarousel";
import ShareDialog from "@/components/ShareDialog";
import { useAuth } from "@/context/AuthContext";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { cn } from "@/lib/cn";

/** Same shape the app's PostCard consumes (shapePost on the backend). */
export interface Post {
  id: string;
  author: string;
  authorId?: string;
  circle: string;
  time: string;
  title?: string;
  content: string;
  image?: string | null;
  images?: string[];
  supportCount: number;
  helpfulCount: number;
  commentCount: number;
  supportedByMe?: boolean;
  helpfulByMe?: boolean;
}

const ActionButton = ({
  icon,
  count,
  active,
  activeClass,
  label,
  onClick,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  count?: number;
  active?: boolean;
  activeClass?: string;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <button
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    className={cn(
      "group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-step font-semibold transition-all hover:bg-light-blue active:scale-95",
      active ? activeClass : "text-ink",
    )}
  >
    <Icon name={icon} size={19} className="transition-transform group-hover:scale-110" />
    {typeof count === "number" && count > 0 ? (
      <span className={cn("text-caption", active ? activeClass : "text-muted")}>{count}</span>
    ) : null}
  </button>
);

/**
 * The app's PostCard, web edition: identical layout and behavior — optimistic
 * reactions reconciled by the server's authoritative counts, ⋯ menu with
 * Edit/Delete on your own posts, tap-through to the author and the post.
 */
export default function PostCard({
  post,
  onShare,
}: {
  post: Post;
  /** Optional share override — default copies the post's real web link. */
  onShare?: (post: Post) => void;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const postImages = post.images?.length ? post.images : post.image ? [post.image] : [];

  const [supported, setSupported] = useState(post.supportedByMe ?? false);
  const [supportCount, setSupportCount] = useState(post.supportCount);
  const [helpful, setHelpful] = useState(post.helpfulByMe ?? false);
  const [helpfulCount, setHelpfulCount] = useState(post.helpfulCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    // Deliberate props→state reconcile: feed polling refreshes the post prop and
    // the server's authoritative counts must win over stale optimistic state
    // (same pattern as the app's PostCard).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(post.supportedByMe ?? false);
    setSupportCount(post.supportCount);
    setHelpful(post.helpfulByMe ?? false);
    setHelpfulCount(post.helpfulCount);
  }, [post.supportedByMe, post.supportCount, post.helpfulByMe, post.helpfulCount]);

  const react = (type: "support" | "helpful") => {
    const wasActive = type === "support" ? supported : helpful;
    const setActive = type === "support" ? setSupported : setHelpful;
    const setCount = type === "support" ? setSupportCount : setHelpfulCount;
    setActive(!wasActive);
    setCount((c) => Math.max(0, c + (wasActive ? -1 : 1)));

    if (isAuthenticated) {
      resourcesApi
        .reactToPost(post.id, type)
        .then((res) => {
          setActive(res.active);
          setCount(type === "support" ? res.supportCount : res.helpfulCount);
        })
        .catch(() => {});
    }
  };

  const isOwnPost = isAuthenticated && !!post.authorId && post.authorId === user?.id;

  const confirmDelete = () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post? It disappears for everyone — this can't be undone.")) return;
    setDeleted(true);
    resourcesApi.deletePost(post.id).catch((err) => {
      setDeleted(false);
      window.alert(`Couldn't delete: ${apiErrorMessage(err)}`);
    });
  };

  const share = () => {
    if (onShare) return onShare(post);
    // ShareDialog: quick-send to your people, multi-select picker, copy-link
    // (real URLs), native share — the app's ShareSheet, web edition.
    setShareOpen(true);
  };

  if (deleted) return null;

  return (
    <article className="animate-fade-up rounded-2xl border border-line bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <header className="flex items-center gap-3">
        {post.authorId ? (
          <Link
            href={`/user/${post.authorId}`}
            className="flex min-w-0 flex-1 items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar name={post.author} size={42} />
            <span className="min-w-0">
              <span className="block truncate text-step font-bold text-ink">{post.author}</span>
              <span className="block truncate text-caption text-muted">
                {post.circle ? `${post.circle} • ${post.time}` : post.time}
              </span>
            </span>
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar name={post.author} size={42} />
            <span className="min-w-0">
              <span className="block truncate text-step font-bold text-ink">{post.author}</span>
              <span className="block truncate text-caption text-muted">
                {post.circle ? `${post.circle} • ${post.time}` : post.time}
              </span>
            </span>
          </span>
        )}

        <div className="relative">
          <button
            aria-label="Post options"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-light-blue"
          >
            <Icon name="more" size={16} />
          </button>
          {menuOpen ? (
            <>
              <button className="fixed inset-0 z-30 cursor-default" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="animate-fade-up absolute right-0 z-40 mt-1 w-44 rounded-xl border border-line bg-card p-1 shadow-lift">
                {isOwnPost ? (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(`/post/${post.id}/edit`);
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-step text-ink hover:bg-light-blue"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="block w-full rounded-lg px-3 py-2 text-left text-step font-medium text-danger hover:bg-light-blue"
                    >
                      Delete Post
                    </button>
                  </>
                ) : null}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-step text-muted hover:bg-light-blue"
                >
                  Report Post
                </button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      <Link href={`/post/${post.id}`} className="mt-3 block">
        {post.title ? <h3 className="text-body font-bold text-ink">{post.title}</h3> : null}
        <p className="mt-1 text-step leading-relaxed whitespace-pre-wrap text-ink">{post.content}</p>
      </Link>

      {postImages.length > 0 ? <ImageCarousel images={postImages} className="mt-3" /> : null}

      <footer className="mt-3 flex items-center justify-between border-t border-line pt-2">
        <ActionButton
          icon="heart"
          label="Support"
          count={supportCount}
          active={supported}
          activeClass="text-danger"
          onClick={() => react("support")}
        />
        <ActionButton
          icon="help"
          label="Helpful"
          count={helpfulCount}
          active={helpful}
          activeClass="text-primary"
          onClick={() => react("helpful")}
        />
        <ActionButton
          icon="chat"
          label="Comments"
          count={post.commentCount}
          onClick={() => router.push(`/post/${post.id}`)}
        />
        <ActionButton icon="send" label="Share" onClick={share} />
      </footer>

      <ShareDialog post={post} open={shareOpen} onClose={() => setShareOpen(false)} />
    </article>
  );
}
