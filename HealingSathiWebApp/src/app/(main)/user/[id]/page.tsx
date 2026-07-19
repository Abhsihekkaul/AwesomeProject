"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard, { type Post } from "@/components/PostCard";
import UserAvatar from "@/components/ui/UserAvatar";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/cn";

type PublicProfile = {
  user: {
    id: string;
    name: string;
    avatarColor?: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    conditions: string[];
    memberSince: string;
    sathiCount: number;
    relation: "none" | "pending" | "sathi" | "self";
    healingPoints?: number;
    badge?: { level: number; name: string; icon: string };
  };
  posts: Post[];
  likedPosts: Post[];
};

/**
 * Read-only public profile (the app's UserProfileScreen): who they are,
 * member-since, their posts + liked posts, Message / + Add Sathi.
 */
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"Posts" | "Liked">("Posts");
  const [requested, setRequested] = useState(false);
  // Set the moment a block succeeds — the backend 404s this profile from then on
  // (blocking is never confirmable to the other side), so we keep the name to
  // render the blocked card instead of "Profile unavailable".
  const [blockedName, setBlockedName] = useState<string | null>(null);

  const { data: profile, loading, isLive, refresh } = useLiveData<PublicProfile | null>(
    ["user-profile", id],
    async () => {
      const fetched = await resourcesApi.getUserProfile(id);
      const withTimes = (posts: (Post & { time: string })[]) =>
        posts.map((p) => ({ ...p, time: timeAgo(p.time) }));
      return {
        user: fetched.user,
        posts: withTimes(fetched.posts ?? []),
        likedPosts: withTimes(fetched.likedPosts ?? []),
      };
    },
    null,
    { emptyData: null },
  );

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-body font-bold text-ink">Profiles are for members</h1>
        <p className="mt-2 text-step text-muted">Sign in to see who&apos;s behind a post.</p>
      </div>
    );
  }

  if (blockedName) {
    const unblock = async () => {
      try {
        await resourcesApi.unblockUser(id);
        setBlockedName(null);
        refresh();
      } catch (err) {
        window.alert(apiErrorMessage(err, "Couldn't unblock"));
      }
    };
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-body font-bold text-ink">{blockedName} is blocked</h1>
        <p className="mt-2 text-step text-muted">
          They can&apos;t message you or send you sathi requests, and neither of you sees the
          other in search. Your block list lives in Settings → Blocked users.
        </p>
        <button
          onClick={unblock}
          className="mt-4 rounded-xl border border-primary px-5 py-2.5 text-step font-semibold text-primary hover:bg-light-purple"
        >
          Unblock
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card shadow-soft" />
        <SkeletonPostCard />
      </div>
    );
  }

  if (isLive && !profile) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-body font-bold text-ink">Profile unavailable</h1>
        <p className="mt-2 text-step text-muted">This account may no longer exist.</p>
      </div>
    );
  }
  if (!profile) return null;

  const { user } = profile;
  const relation = requested ? "pending" : user.relation;
  const memberSince = new Date(user.memberSince).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const addSathi = async () => {
    setRequested(true);
    try {
      await resourcesApi.sendSathiRequest(user.id);
    } catch (err) {
      setRequested(false);
      window.alert(apiErrorMessage(err, "Couldn't send the request"));
    }
  };

  const message = async () => {
    try {
      router.push(`/chats/${await resourcesApi.openChatWith(user.id)}`);
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't open the chat"));
    }
  };

  const block = async () => {
    const ok = window.confirm(
      `Block ${user.name}?\n\nThey won't be able to message you or send you sathi requests, and an existing sathi connection is removed. They won't be notified. You can unblock them anytime in Settings → Blocked users.`,
    );
    if (!ok) return;
    try {
      await resourcesApi.blockUser(user.id);
      setBlockedName(user.name);
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't block"));
    }
  };

  const shown = tab === "Posts" ? profile.posts : profile.likedPosts;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Hero with cover */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card text-center shadow-soft">
        <div className="relative h-28 bg-gradient-to-r from-primary/25 via-info/15 to-primary/25 sm:h-36">
          {user.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- covers are data-URIs
            <img src={user.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-6 pt-0">
        <UserAvatar
          name={user.name}
          src={user.avatarUrl}
          color={user.avatarColor}
          size={72}
          className="mx-auto -mt-9 ring-4 ring-card"
        />
        <h1 className="mt-3 text-heading font-bold text-ink">{user.name}</h1>
        <p className="mt-1 text-caption text-muted">
          Member since {memberSince} · {user.sathiCount} {user.sathiCount === 1 ? "sathi" : "sathis"}
        </p>
        {user.badge ? (
          <p className="mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-light-purple px-3 py-1 text-caption font-bold text-primary">
              {user.badge.icon} {user.badge.name} · Level {user.badge.level}
              <span className="font-semibold text-muted">· ✨ {user.healingPoints ?? 0} pts</span>
            </span>
          </p>
        ) : null}
        {user.conditions.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {user.conditions.map((c) => (
              <span key={c} className="rounded-full bg-light-purple px-3 py-1 text-caption font-semibold text-primary">
                {c}
              </span>
            ))}
          </div>
        ) : null}
        {user.relation !== "self" ? (
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={message}
              className="rounded-xl bg-primary px-5 py-2.5 text-step font-semibold text-white hover:bg-primary-dark"
            >
              Message
            </button>
            {relation === "sathi" ? (
              <span className="rounded-xl bg-light-green px-5 py-2.5 text-step font-semibold text-success">
                ✓ Sathis
              </span>
            ) : relation === "pending" ? (
              <span className="rounded-xl bg-light-blue px-5 py-2.5 text-step font-semibold text-muted">
                Requested ✓
              </span>
            ) : (
              <button
                onClick={addSathi}
                className="rounded-xl border border-primary px-5 py-2.5 text-step font-semibold text-primary hover:bg-light-purple"
              >
                + Add Sathi
              </button>
            )}
          </div>
        ) : null}
        {user.relation !== "self" ? (
          <button
            onClick={block}
            className="mt-3 text-caption font-medium text-muted hover:text-danger hover:underline"
          >
            Block {user.name.split(" ")[0]}
          </button>
        ) : null}
        </div>
      </div>

      {/* Posts / Liked tabs */}
      <div className="flex gap-2">
        {(["Posts", "Liked"] as const).map((t) => (
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

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card shadow-soft p-6 text-center text-step text-muted">
          Nothing here yet.
        </p>
      ) : (
        shown.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
