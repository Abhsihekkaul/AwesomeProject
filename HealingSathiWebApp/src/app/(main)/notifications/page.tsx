"use client";

import { useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon, { type IconName } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { useLiveData } from "@/hooks/useLiveData";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { resourcesApi } from "@/api/resourcesApi";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/cn";

type Notification = {
  id: string;
  type: "Groups" | "Chats" | "System";
  title: string;
  message: string;
  time: string;
  unread?: boolean;
  chatId?: string | null;
};

type SathiRequest = {
  id: string;
  name: string;
  fromUserId?: string;
  time: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "Groups", title: "Jamie replied to your post", message: "Yes! The 4-7-8 technique completely changed my sleep quality.", time: "18m ago", unread: true },
  { id: "n2", type: "Chats", title: "New message from Alex K.", message: "I've found that pacing myself helps the most...", time: "42m ago", unread: true },
  { id: "n3", type: "System", title: "Welcome to HealingSathi", message: "Your profile setup is complete. Explore the community.", time: "1d ago" },
];

const DEMO_REQUESTS: SathiRequest[] = [
  { id: "r1", name: "Priya Sharma", time: "5m ago" },
  { id: "r2", name: "Meera Iyer", time: "2h ago" },
];

const TABS = ["All", "Requests", "Groups", "Chats", "System"] as const;
type Tab = (typeof TABS)[number];

const typeIcon = (type: Notification["type"]): IconName =>
  type === "Groups" ? "people" : type === "Chats" ? "chat" : "shield";

/**
 * The app's NotificationsScreen: filter tabs, sathi request cards with
 * Accept/Decline, message notifications that open their conversation,
 * mark-all-read.
 */
export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("All");
  const { refreshUnread } = useChatNotifications();

  const { data: notifications, isLive, loading, refresh } = useLiveData<Notification[]>(
    ["notifications"],
    async () =>
      (await resourcesApi.getNotifications()).map((n: Notification & { time: string }) => ({
        ...n,
        time: timeAgo(n.time),
      })),
    DEMO_NOTIFICATIONS,
  );

  const { data: requests, refresh: refreshRequests } = useLiveData<SathiRequest[]>(
    ["sathi-requests"],
    async () =>
      (await resourcesApi.getSathiRequests()).map(
        (r: { id: string; name: string; fromUserId?: string; time: string }) => ({
          ...r,
          time: timeAgo(r.time),
        }),
      ),
    DEMO_REQUESTS,
  );

  const [decided, setDecided] = useState<Record<string, "accepted" | "declined">>({});

  const respond = (id: string, action: "accept" | "decline") => {
    setDecided((prev) => ({ ...prev, [id]: action === "accept" ? "accepted" : "declined" }));
    if (isLive) {
      resourcesApi
        .respondToSathiRequest(id, action)
        .then(() => refreshRequests())
        .catch(() => {});
    }
  };

  const markAllRead = () => {
    if (isLive) {
      resourcesApi
        .markAllNotificationsRead()
        .then(() => {
          refresh();
          refreshUnread();
        })
        .catch(() => {});
    }
  };

  const visible = tab === "All" ? notifications : notifications.filter((n) => n.type === tab);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const openRequests = requests.filter((r) => decided[r.id] !== "declined");
  const pendingCount = openRequests.filter((r) => !decided[r.id]).length;

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-heading font-bold text-ink">Notifications</h1>
        {unreadCount > 0 ? (
          <button onClick={markAllRead} className="text-step font-semibold text-primary hover:underline">
            Mark all read
          </button>
        ) : null}
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-step font-semibold",
              tab === t ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
            )}
          >
            {t}
            {t === "Requests" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tab === "Requests" ? (
          openRequests.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card shadow-soft p-6 text-center text-step text-muted">
              No pending Sathi requests. 💜
            </p>
          ) : (
            openRequests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-line bg-card shadow-soft p-4">
                {r.fromUserId ? (
                  <Link href={`/user/${r.fromUserId}`}>
                    <UserAvatar name={r.name} size={44} />
                  </Link>
                ) : (
                  <UserAvatar name={r.name} size={44} />
                )}
                <div className="flex-1">
                  <p className="text-step font-bold text-ink">{r.name}</p>
                  <p className="text-caption text-muted">Wants to connect with you · {r.time}</p>
                  {decided[r.id] === "accepted" ? (
                    <span className="mt-2 inline-block rounded-full bg-light-green px-3 py-1 text-caption font-semibold text-success">
                      ✓ You&apos;re now Sathis
                    </span>
                  ) : (
                    <span className="mt-2 flex gap-2">
                      <button
                        onClick={() => respond(r.id, "accept")}
                        className="rounded-full bg-primary px-4 py-1.5 text-caption font-semibold text-white hover:bg-primary-dark"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respond(r.id, "decline")}
                        className="rounded-full border border-line px-4 py-1.5 text-caption font-semibold text-muted hover:bg-light-blue"
                      >
                        Decline
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        ) : loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card shadow-soft p-6 text-center text-step text-muted">
            You&apos;re all caught up here.
          </p>
        ) : (
          visible.map((n) => {
            const card = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4",
                  n.unread ? "border-primary/30 bg-light-purple/40" : "border-line bg-card",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-light-purple text-primary">
                  <Icon name={typeIcon(n.type)} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-step font-bold text-ink">{n.title}</span>
                  <span className="block text-caption leading-snug text-muted">{n.message}</span>
                  <span className="mt-1 block text-caption font-semibold text-muted">{n.time}</span>
                </span>
                {n.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
            );
            return n.chatId ? (
              <Link key={n.id} href={`/chats/${n.chatId}`} className="block hover:opacity-90">
                {card}
              </Link>
            ) : (
              <div key={n.id}>{card}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
