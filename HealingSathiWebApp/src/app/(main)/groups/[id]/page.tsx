"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard, { type Post } from "@/components/PostCard";
import Composer from "@/components/Composer";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/cn";

type GroupInfo = {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  moderator?: string;
  memberCount: number;
  joined: boolean;
};

type Member = { id: string; name: string; isMe?: boolean; relation?: string };

const TABS = ["Posts", "Members", "About"] as const;
type Tab = (typeof TABS)[number];

/**
 * A group's home (the app's GroupDetailsScreen): live Posts / Members / About
 * tabs, join toggle, "+ Post" preselecting this group as the destination.
 */
export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("Posts");
  const [composerOpen, setComposerOpen] = useState(false);

  const { data: group, refresh: refreshGroup } = useLiveData<GroupInfo | null>(
    ["group", id],
    async () =>
      (await resourcesApi.getGroups()).find((g: GroupInfo) => g.id === id) ?? null,
    null,
    { emptyData: null },
  );

  const { data: posts, loading, refresh: refreshPosts } = useLiveData<Post[]>(
    ["group-posts", id],
    async () =>
      (await resourcesApi.getFeed(id)).map((p: Post & { time: string }) => ({
        ...p,
        time: timeAgo(p.time),
      })),
    [],
    { pollMs: 20_000 },
  );

  const { data: members } = useLiveData<Member[]>(
    ["group-members", id],
    async () => resourcesApi.getGroupMembers(id),
    [],
  );

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-8 text-center">
        <h1 className="text-body font-bold text-ink">Group pages are for members</h1>
        <p className="mt-2 text-step text-muted">Sign in to browse real circles.</p>
      </div>
    );
  }

  const toggleJoin = async () => {
    try {
      await resourcesApi.toggleJoinGroup(id);
      await refreshGroup();
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't update membership"));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-light-purple text-primary">
            <Icon name="people" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-heading font-bold text-ink">{group?.name ?? "Group"}</h1>
            <p className="text-caption text-muted">
              {group?.tag ? `${group.tag} · ` : ""}
              {group?.memberCount ?? members.length} members
              {group?.moderator ? ` · Moderated by ${group.moderator}` : ""}
            </p>
          </div>
          {group ? (
            <button
              onClick={toggleJoin}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-caption font-semibold",
                group.joined ? "bg-light-green text-success" : "bg-primary text-white hover:bg-primary-dark",
              )}
            >
              {group.joined ? "Joined ✓" : "Join"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
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
      </div>

      {tab === "Posts" ? (
        <>
          {group?.joined ? (
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full rounded-2xl border border-dashed border-primary/50 bg-light-purple/40 p-3 text-step font-semibold text-primary hover:bg-light-purple"
            >
              + Post in {group.name}
            </button>
          ) : null}
          {loading ? (
            <SkeletonPostCard />
          ) : posts.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted">
              No posts in this circle yet — be the first to share.
            </p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </>
      ) : tab === "Members" ? (
        <div className="rounded-2xl border border-line bg-card p-2">
          {members.length === 0 ? (
            <p className="p-4 text-center text-step text-muted">No members listed yet.</p>
          ) : (
            members.map((m) => (
              <Link
                key={m.id}
                href={`/user/${m.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-light-blue"
              >
                <UserAvatar name={m.name} size={38} />
                <span className="flex-1 text-step font-semibold text-ink">{m.name}</span>
                <span className="text-caption text-primary">View →</span>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-body font-bold text-ink">About this circle</h2>
          <p className="mt-2 text-step leading-relaxed text-muted">
            {group?.description || "A supportive, moderated space for people on the same journey."}
          </p>
        </div>
      )}

      <Composer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => {
          refreshPosts();
          router.refresh();
        }}
        presetGroupId={id}
      />
    </div>
  );
}
