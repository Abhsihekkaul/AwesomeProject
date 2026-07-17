"use client";

import { useState } from "react";
import Link from "next/link";
import PostCard, { type Post } from "@/components/PostCard";
import Composer from "@/components/Composer";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { dummyPosts } from "@/lib/dummyPosts";
import { timeAgo } from "@/lib/timeAgo";

/**
 * The home feed — same rules as the app's HomeScreen: your posts + your
 * sathis' + your groups' + condition-based discovery when signed in; the
 * built-in demo posts when exploring signed out. 20s polling + refetch on
 * focus keep it near-real-time.
 */
export default function FeedPage() {
  const { user, isDemo } = useAuth();
  const [composerOpen, setComposerOpen] = useState(false);

  const { data: posts, isLive, loading, refresh } = useLiveData<Post[]>(
    ["feed"],
    async () =>
      (await resourcesApi.getFeed()).map((p: Post & { time: string }) => ({
        ...p,
        time: timeAgo(p.time),
      })),
    dummyPosts as unknown as Post[],
    { pollMs: 20_000 },
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Composer strip — clicking it opens the full composer */}
      <button
        onClick={() => setComposerOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-4 text-left transition-shadow hover:shadow-sm"
      >
        <UserAvatar name={user?.name ?? "Demo"} src={user?.avatarUrl} size={40} />
        <span className="flex-1 rounded-full bg-light-blue px-4 py-2.5 text-step text-muted">
          What&apos;s on your mind{user?.name ? `, ${user.name.split(" ")[0]}` : ""}?
        </span>
        <span className="text-primary">
          <Icon name="upload" size={18} />
        </span>
      </button>

      {isDemo ? (
        <p className="rounded-xl bg-light-purple px-4 py-2 text-center text-caption font-medium text-primary">
          Demo mode — these are sample posts. Sign in for your real circles.
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <SkeletonPostCard key={i} />
          ))}
        </div>
      ) : null}

      {isLive && !loading && posts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-8 text-center">
          <h2 className="text-body font-bold text-ink">Your stream is quiet — for now</h2>
          <p className="mt-2 text-step text-muted">
            The feed fills with your posts, your sathis&apos; posts and your groups&apos;
            conversations. Find your people to get started.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-step font-semibold text-white hover:bg-primary-dark"
          >
            Find people
          </Link>
        </div>
      ) : null}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <Composer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => refresh()}
      />
    </div>
  );
}
