"use client";

import { useRef, useState } from "react";
import PostCard, { type Post } from "@/components/PostCard";
import UserAvatar from "@/components/ui/UserAvatar";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { authApi } from "@/api/authApi";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { fileToCompressedDataUri } from "@/lib/compressImage";
import { timeAgo } from "@/lib/timeAgo";
import { dummyPosts } from "@/lib/dummyPosts";
import { cn } from "@/lib/cn";

/**
 * Your own profile (the app's ProfileScreen): hero with photo upload
 * (camera badge → pick → compressed → PATCH /auth/me), real counts,
 * My Posts / Saved tabs.
 */
export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [tab, setTab] = useState<"My Posts" | "Saved">("My Posts");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapTimes = (posts: (Post & { time: string })[]) =>
    posts.map((p) => ({ ...p, time: timeAgo(p.time) }));

  const { data: myPosts, loading } = useLiveData<Post[]>(
    ["my-posts"],
    async () => mapTimes(await resourcesApi.getMyPosts()),
    dummyPosts.slice(0, 2) as unknown as Post[],
  );
  const { data: saved } = useLiveData<Post[]>(
    ["saved-posts"],
    async () => mapTimes(await resourcesApi.getSavedPosts()),
    [] as Post[],
  );
  const { data: sathis } = useLiveData<{ id: string }[]>(
    ["sathis"],
    async () => resourcesApi.getSathis(),
    [],
  );

  const changePhoto = async (file: File) => {
    if (!isAuthenticated) return;
    try {
      const avatarUrl = await fileToCompressedDataUri(file);
      updateUser(await authApi.updateMe({ avatarUrl }));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't update the photo"));
    }
  };

  const removePhoto = async () => {
    if (!isAuthenticated) return;
    try {
      updateUser(await authApi.updateMe({ avatarUrl: null }));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't remove the photo"));
    }
  };

  const shown = tab === "My Posts" ? myPosts : saved;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Hero */}
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <div className="relative mx-auto w-fit">
          <UserAvatar name={user?.name ?? "Demo"} src={user?.avatarUrl} size={84} />
          {isAuthenticated ? (
            <button
              aria-label="Change photo"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark"
            >
              📷
            </button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) changePhoto(file);
            e.target.value = "";
          }}
        />
        <h1 className="mt-3 text-heading font-bold text-ink">{user?.name ?? "Demo explorer"}</h1>
        <p className="text-caption text-muted">{user?.email ?? "Sign in for your real profile"}</p>
        {user?.avatarUrl ? (
          <button onClick={removePhoto} className="mt-1 text-caption font-semibold text-muted underline hover:text-ink">
            Remove photo
          </button>
        ) : null}
        {(user?.conditions ?? []).length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {user!.conditions!.map((c) => (
              <span key={c} className="rounded-full bg-light-purple px-3 py-1 text-caption font-semibold text-primary">
                {c}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex justify-center gap-8 text-center">
          <span>
            <span className="block text-body font-bold text-ink">{myPosts.length}</span>
            <span className="text-caption text-muted">Posts</span>
          </span>
          <span>
            <span className="block text-body font-bold text-ink">{sathis.length}</span>
            <span className="text-caption text-muted">Sathis</span>
          </span>
          <span>
            <span className="block text-body font-bold text-ink">{saved.length}</span>
            <span className="text-caption text-muted">Saved</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["My Posts", "Saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl border py-2 text-step font-semibold",
              tab === t ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonPostCard />
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted">
          {tab === "My Posts" ? "You haven't posted yet — your story matters." : "No saved posts yet."}
        </p>
      ) : (
        shown.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
