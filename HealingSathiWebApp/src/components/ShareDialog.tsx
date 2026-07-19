"use client";

import { useEffect, useState } from "react";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { resourcesApi } from "@/api/resourcesApi";
import { cn } from "@/lib/cn";
import type { Post } from "@/components/PostCard";

type ShareTarget = {
  key: string;
  name: string;
  chatId?: string;
  userId?: string;
};

const DEMO_TARGETS: ShareTarget[] = [
  { key: "d1", name: "Shivani" },
  { key: "d2", name: "Arun" },
  { key: "d3", name: "Priya" },
  { key: "d4", name: "Alex" },
  { key: "d5", name: "Neha" },
];

/**
 * The app's ShareSheet, web edition: quick row of your top people (tap =
 * instant send), a multi-select picker over ALL chats + sathis with one
 * Share (N) button, copy-link (real URLs), and the native share sheet.
 * On phones it rises as a bottom sheet; on desktop it's a centered dialog.
 */
export default function ShareDialog({
  post,
  open,
  onClose,
}: {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}) {
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"quick" | "pick">("quick");
  const [quick, setQuick] = useState<ShareTarget[]>([]);
  const [all, setAll] = useState<ShareTarget[]>([]);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, ShareTarget>>({});
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fresh state + top-5 targets every time the dialog opens.
  /* eslint-disable react-hooks/set-state-in-effect -- deliberate reset-on-open */
  useEffect(() => {
    if (!open) return;
    setMode("quick");
    setSentTo({});
    setSelected({});
    setQuery("");
    setCopied(false);
    if (!isAuthenticated) {
      setQuick(DEMO_TARGETS);
      setAll(DEMO_TARGETS);
      return;
    }
    (async () => {
      try {
        const [chats, sathis] = await Promise.all([
          resourcesApi.getChats(),
          resourcesApi.getSathis().catch(() => []),
        ]);
        const targets: ShareTarget[] = chats.map(
          (c: { id: string; userId?: string; name: string }) => ({
            key: c.id,
            chatId: c.id,
            userId: c.userId,
            name: c.name,
          }),
        );
        const listed = new Set(chats.map((c: { userId?: string }) => c.userId));
        for (const s of sathis as { id: string; name: string }[]) {
          if (!listed.has(s.id)) targets.push({ key: `u-${s.id}`, userId: s.id, name: s.name });
        }
        setQuick(targets.slice(0, 5));
        setAll(targets);
      } catch {
        setQuick([]);
        setAll([]);
      }
    })();
  }, [open, isAuthenticated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open || !post) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;

  const deliverTo = async (target: ShareTarget) => {
    const chatId = target.chatId ?? (await resourcesApi.openChatWith(target.userId!));
    await resourcesApi.sendMessage(chatId, { sharedPostId: post.id });
  };

  const quickSend = async (target: ShareTarget) => {
    if (sentTo[target.key]) return;
    setSentTo((prev) => ({ ...prev, [target.key]: true }));
    if (!isAuthenticated) return;
    try {
      await deliverTo(target);
    } catch {
      setSentTo((prev) => ({ ...prev, [target.key]: false }));
    }
  };

  const toggleSelect = (target: ShareTarget) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[target.key]) delete next[target.key];
      else next[target.key] = target;
      return next;
    });

  const shareToSelected = async () => {
    const targets = Object.values(selected);
    if (targets.length === 0 || sharing) return;
    if (!isAuthenticated) {
      onClose();
      return;
    }
    setSharing(true);
    const results = await Promise.all(
      targets.map(async (t) => {
        try {
          await deliverTo(t);
          return { t, ok: true };
        } catch {
          return { t, ok: false };
        }
      }),
    );
    setSharing(false);
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      onClose();
      return;
    }
    setSelected(Object.fromEntries(failed.map((r) => [r.t.key, r.t])));
    window.alert(`Couldn't send to ${failed.map((r) => r.t.name).join(", ")} — they stay selected, try again.`);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    const text = post.title || post.content.slice(0, 80);
    if (navigator.share) {
      try {
        await navigator.share({ title: "HealingSathi", text, url: postUrl });
        onClose();
      } catch {
        // dismissed
      }
    } else {
      copyLink();
    }
  };

  const q = query.trim().toLowerCase();
  const visible = q ? all.filter((t) => t.name.toLowerCase().includes(q)) : all;
  const selectedCount = Object.keys(selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-up rounded-t-2xl border border-line bg-card p-5 shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === "quick" ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-heading font-bold text-ink">Share to</h2>
              <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">✕</button>
            </div>

            {quick.length === 0 ? (
              <p className="mt-4 text-center text-step text-muted">
                No sathis yet — connect with people to share posts directly.
              </p>
            ) : (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
                {quick.map((t) => (
                  <button key={t.key} onClick={() => quickSend(t)} className="w-16 shrink-0 text-center">
                    <UserAvatar name={t.name} size={52} className="mx-auto" />
                    <span className="mt-1 block truncate text-caption font-medium text-ink">{t.name}</span>
                    <span className={cn("block text-[10px] font-bold text-success", !sentTo[t.key] && "opacity-0")}>
                      Sent ✓
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="my-4 h-px bg-line" />

            <div className="space-y-1">
              <button onClick={() => setMode("pick")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-light-blue">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue">💬</span>
                <span className="text-step font-medium text-ink">Choose people...</span>
              </button>
              <button onClick={copyLink} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-light-blue">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue">🔗</span>
                <span className="text-step font-medium text-ink">{copied ? "Link copied ✓" : "Copy link"}</span>
              </button>
              <button onClick={nativeShare} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-light-blue">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue">↗️</span>
                <span className="text-step font-medium text-ink">Share via other apps...</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setMode("quick")} aria-label="Back" className="text-body font-semibold text-ink">←</button>
              <h2 className="flex-1 text-heading font-bold text-ink">
                {selectedCount > 0 ? `Share with ${selectedCount} ${selectedCount === 1 ? "person" : "people"}` : "Share with..."}
              </h2>
              <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">✕</button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your people..."
              className="mt-3 w-full rounded-full border border-line bg-light-blue px-3.5 py-2 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <div className="mt-2 max-h-72 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="p-4 text-center text-step text-muted">
                  {q ? `No one matches "${query.trim()}".` : "No sathis yet."}
                </p>
              ) : (
                visible.map((t) => {
                  const isSelected = !!selected[t.key];
                  return (
                    <button key={t.key} onClick={() => toggleSelect(t)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-light-blue">
                      <UserAvatar name={t.name} size={36} />
                      <span className="flex-1 truncate text-step font-medium text-ink">{t.name}</span>
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 text-caption font-extrabold",
                          isSelected ? "border-primary bg-primary text-white" : "border-line text-transparent",
                        )}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={shareToSelected}
              disabled={selectedCount === 0 || sharing}
              className="mt-4 w-full rounded-xl bg-primary py-3 text-step font-bold text-white disabled:opacity-40"
            >
              {sharing ? "Sharing..." : selectedCount > 0 ? `Share (${selectedCount})` : "Share"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
