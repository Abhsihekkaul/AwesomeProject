"use client";

import { use } from "react";
import PostCard, { type Post } from "@/components/PostCard";
import CommentThread from "@/components/CommentThread";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { dummyPosts } from "@/lib/dummyPosts";
import { timeAgo } from "@/lib/timeAgo";

/**
 * A post's own page — the app's PostDetailsScreen with a real, shareable URL.
 * The card renders exactly like the feed; the full threaded conversation
 * lives underneath.
 */
export default function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: post, isLive, loading } = useLiveData<Post | null>(
    ["post", id],
    async () => {
      const { post: fetched } = await resourcesApi.getPost(id);
      return { ...fetched, time: timeAgo(fetched.time) };
    },
    (dummyPosts.find((p) => p.id === id) as unknown as Post) ?? (dummyPosts[0] as unknown as Post),
    { emptyData: null },
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-xl">
        <SkeletonPostCard />
      </div>
    );
  }

  if (isLive && !post) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-body font-bold text-ink">This post is gone</h1>
        <p className="mt-2 text-step text-muted">It may have been deleted by its author.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {post ? <PostCard post={post} /> : null}
      <div className="rounded-2xl border border-line bg-card shadow-soft p-4">
        <CommentThread postId={id} />
      </div>
    </div>
  );
}
