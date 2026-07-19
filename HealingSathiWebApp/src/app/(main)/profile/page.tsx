"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard, { type Post } from "@/components/PostCard";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import EditProfileDialog from "@/components/EditProfileDialog";
import { SkeletonPostCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { authApi } from "@/api/authApi";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { fileToCompressedDataUri } from "@/lib/compressImage";
import { timeAgo } from "@/lib/timeAgo";
import { dummyPosts } from "@/lib/dummyPosts";
import HealingBadge from "@/components/HealingBadge";
import { cn } from "@/lib/cn";

type Sathi = { id: string; name: string };
type Group = { id: string; name: string; joined?: boolean };

/**
 * Your own profile (the app's ProfileScreen): cover photo + hero with photo
 * upload (camera badge → pick → compressed → PATCH /auth/me), real counts,
 * My Sathis / My Groups directories, My Posts / Saved tabs.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [tab, setTab] = useState<"My Posts" | "Saved" | "Commented">("My Posts");
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
  const { data: commented } = useLiveData<Post[]>(
    ["commented-posts"],
    async () => mapTimes(await resourcesApi.getCommentedPosts()),
    [] as Post[],
  );
  const { data: sathis, isLive } = useLiveData<Sathi[]>(
    ["sathis"],
    async () => resourcesApi.getSathis(),
    [],
  );
  const { data: groups } = useLiveData<Group[]>(
    ["joined-groups"],
    async () => (await resourcesApi.getGroups()).filter((g: Group) => g.joined),
    [] as Group[],
  );

  const changePhoto = async (file: File, field: "avatarUrl" | "coverUrl") => {
    if (!isAuthenticated) return;
    try {
      const dataUri = await fileToCompressedDataUri(file);
      updateUser(await authApi.updateMe({ [field]: dataUri }));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't update the photo"));
    }
  };

  const removePhoto = async (field: "avatarUrl" | "coverUrl") => {
    if (!isAuthenticated) return;
    try {
      updateUser(await authApi.updateMe({ [field]: null }));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't remove the photo"));
    }
  };

  const openChat = async (sathi: Sathi) => {
    if (!isLive) return;
    try {
      router.push(`/chats/${await resourcesApi.openChatWith(sathi.id)}`);
    } catch {
      router.push("/chats");
    }
  };

  const shown = tab === "My Posts" ? myPosts : tab === "Saved" ? saved : commented;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Hero with cover */}
      <div className="animate-fade-up overflow-hidden rounded-2xl border border-line bg-card text-center shadow-soft">
        {/* Cover photo — brand gradient until one is set */}
        <div className="relative h-32 bg-gradient-to-r from-primary/25 via-info/15 to-primary/25 sm:h-40">
          {user?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- covers are data-URIs
            <img src={user.coverUrl} alt="Profile cover" className="h-full w-full object-cover" />
          ) : null}
          {isAuthenticated ? (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute right-3 bottom-3 rounded-full bg-black/50 px-3 py-1.5 text-caption font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/65"
            >
              📷 {user?.coverUrl ? "Change cover" : "Add cover"}
            </button>
          ) : null}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) changePhoto(file, "coverUrl");
            e.target.value = "";
          }}
        />

        <div className="p-6 pt-0">
          <div className="relative mx-auto -mt-11 w-fit">
            <UserAvatar
              name={user?.name ?? "Demo"}
              src={user?.avatarUrl}
              color={user?.avatarColor}
              size={84}
              className="ring-4 ring-card"
            />
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
              if (file) changePhoto(file, "avatarUrl");
              e.target.value = "";
            }}
          />
          <h1 className="mt-3 text-heading font-bold text-ink">{user?.name ?? "Demo explorer"}</h1>
          <p className="text-caption text-muted">{user?.email ?? "Sign in for your real profile"}</p>
          <div className="mt-1 flex justify-center gap-3">
            {user?.avatarUrl ? (
              <button onClick={() => removePhoto("avatarUrl")} className="text-caption font-semibold text-muted underline hover:text-ink">
                Remove photo
              </button>
            ) : null}
            {user?.coverUrl ? (
              <button onClick={() => removePhoto("coverUrl")} className="text-caption font-semibold text-muted underline hover:text-ink">
                Remove cover
              </button>
            ) : null}
          </div>
          {isAuthenticated ? (
            <div className="mt-3">
              <button
                onClick={() => setEditing(true)}
                className="rounded-xl border border-line bg-card px-4 py-1.5 text-step font-semibold text-ink transition-all hover:border-primary/40 hover:bg-light-purple hover:text-primary"
              >
                Edit profile
              </button>
            </div>
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
      </div>

      {/* Healing Points badge + progress to the next level */}
      <HealingBadge />

      {/* My Sathis / My Groups directories (the RightRail's data, visible on
          every screen size here — phones never see the desktop rail) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-4 text-left shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-step font-bold text-ink">My Sathis</h2>
            <Link href="/search" className="text-caption font-semibold text-primary hover:underline">
              Find people
            </Link>
          </div>
          {sathis.length === 0 ? (
            <p className="mt-2 text-caption text-muted">No sathis yet — find your people.</p>
          ) : (
            <div className="mt-2 space-y-1">
              {sathis.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Link
                    href={isLive ? `/user/${s.id}` : "/profile"}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 hover:bg-light-blue"
                  >
                    <UserAvatar name={s.name} size={30} />
                    <span className="truncate text-step text-ink">{s.name}</span>
                  </Link>
                  <button
                    aria-label={`Message ${s.name}`}
                    onClick={() => openChat(s)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-light-purple text-primary hover:opacity-90"
                  >
                    <Icon name="chat" size={13} />
                  </button>
                </div>
              ))}
              {sathis.length > 6 ? (
                <p className="pt-1 text-caption text-muted">+ {sathis.length - 6} more</p>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 text-left shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-step font-bold text-ink">My Groups</h2>
            <Link href="/groups" className="text-caption font-semibold text-primary hover:underline">
              Browse
            </Link>
          </div>
          {groups.length === 0 ? (
            <p className="mt-2 text-caption text-muted">Not in any circles yet — browse groups.</p>
          ) : (
            <div className="mt-2 space-y-1">
              {groups.slice(0, 6).map((g) => (
                <Link
                  key={g.id}
                  href={isLive ? `/groups/${g.id}` : "/groups"}
                  className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-light-blue"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-light-purple text-primary">
                    <Icon name="people" size={13} />
                  </span>
                  <span className="truncate text-step text-ink">{g.name}</span>
                </Link>
              ))}
              {groups.length > 6 ? (
                <p className="pt-1 text-caption text-muted">+ {groups.length - 6} more</p>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["My Posts", "Saved", "Commented"] as const).map((t) => (
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
        <p className="rounded-2xl border border-line bg-card shadow-soft p-6 text-center text-step text-muted">
          {tab === "My Posts"
            ? "You haven't posted yet — your story matters."
            : tab === "Saved"
              ? "No saved posts yet."
              : "You haven't commented anywhere yet — join a conversation."}
        </p>
      ) : (
        shown.map((post) => <PostCard key={post.id} post={post} />)
      )}

      {editing ? <EditProfileDialog onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
