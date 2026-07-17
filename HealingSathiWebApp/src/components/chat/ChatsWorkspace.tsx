"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { joinChatRoom } from "@/api/chatSocket";
import { fileToCompressedDataUri } from "@/lib/compressImage";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/cn";
import { SkeletonChatRow } from "@/components/ui/Skeleton";
import ImageViewer from "@/components/ui/ImageViewer";

type ChatListItem = {
  id?: string;
  name: string;
  userId?: string;
  last: string;
  time: string;
  unread: number;
};

type SharedPostCard = {
  id?: string;
  author?: string;
  circle?: string;
  title?: string;
  content?: string;
  image?: string | null;
  supportCount?: number;
  commentCount?: number;
};

type ChatMessage = {
  id: string;
  mine?: boolean;
  text: string;
  image?: string | null;
  sharedPost?: SharedPostCard | null;
  time: string;
};

// Demo-mode content (signed out only) — a taste of the real thing.
const DEMO_CHATS: ChatListItem[] = [
  { name: "Alex K.", last: "I've found that pacing myself helps the most...", time: "10:22 AM", unread: 2 },
  { name: "Maya Harrison", last: "Finally found a sleep routine that works", time: "23m ago", unread: 0 },
  { name: "Priya Sharma", last: "Meditation before bed has really helped me relax.", time: "1h ago", unread: 1 },
  { name: "Rohan Kapoor", last: "Anyone else journaling before sleep?", time: "2h ago", unread: 0 },
];

const DEMO_THREAD: ChatMessage[] = [
  { id: "1", text: "I've found that pacing myself and not pushing through pain helps the most. What's been your biggest challenge lately?", time: "10:18 AM" },
  { id: "2", mine: true, text: "Definitely the unpredictability. I've been trying journaling — it helps me notice patterns.", time: "10:22 AM" },
  { id: "3", text: "That's such a good idea. It's really comforting to talk to someone who gets it. 💙", time: "10:24 AM" },
];

const formatClock = (value?: string | Date) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return String(value ?? "");
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
};

/** One message bubble — text, photo, and/or a tappable shared-post mini card. */
function MessageBubble({
  message,
  onImageClick,
}: {
  message: ChatMessage;
  onImageClick?: (src: string) => void;
}) {
  const shared = message.sharedPost;
  return (
    <div className={cn("flex", message.mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm",
          message.mine
            ? "rounded-br-md bg-gradient-to-br from-primary to-primary-dark text-white"
            : "rounded-bl-md bg-light-blue text-ink",
        )}
      >
        {message.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.image}
            alt="shared photo"
            className="mb-1 max-h-72 w-full cursor-pointer rounded-xl object-contain"
            onClick={() => onImageClick?.(message.image!)}
          />
        ) : null}
        {shared ? (
          <Link
            href={shared.id ? `/post/${shared.id}` : "#"}
            className="mb-1 block w-60 overflow-hidden rounded-xl border border-line bg-card text-ink"
          >
            <span className="flex items-center gap-2 px-2.5 pt-2.5">
              <UserAvatar name={shared.author ?? "Member"} size={22} />
              <span className="min-w-0">
                <span className="block truncate text-caption font-bold">{shared.author}</span>
                {shared.circle ? (
                  <span className="block truncate text-[10px] text-muted">in {shared.circle}</span>
                ) : null}
              </span>
            </span>
            {shared.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shared.image} alt="" className="mt-2 max-h-40 w-full object-cover" />
            ) : null}
            {shared.title ? (
              <span className="block px-2.5 pt-2 text-step font-bold">{shared.title}</span>
            ) : null}
            <span className="block px-2.5 pt-1 pb-2 text-caption leading-snug text-muted">
              {(shared.content ?? "").slice(0, 120)}
            </span>
            <span className="flex items-center justify-between border-t border-line px-2.5 py-1.5 text-[10px] font-semibold text-muted">
              ♥ {shared.supportCount ?? 0} · 💬 {shared.commentCount ?? 0}
              <span className="text-primary">View post →</span>
            </span>
          </Link>
        ) : null}
        {message.text ? <p className="text-step leading-relaxed whitespace-pre-wrap">{message.text}</p> : null}
        <p className={cn("mt-1 text-right text-[10px]", message.mine ? "text-white/80" : "text-muted")}>
          {message.time}
          {message.mine ? "  ✓✓" : ""}
        </p>
      </div>
    </div>
  );
}

/** The open conversation: live socket receive + 15s polling fallback + send. */
function ChatThread({ chat }: { chat: ChatListItem }) {
  const { isAuthenticated, user } = useAuth();
  const { setActiveChat, markChatRead } = useChatNotifications();
  const chatId = chat.id;

  const [messages, setMessages] = useState<ChatMessage[]>(isAuthenticated ? [] : DEMO_THREAD);
  const [loadingThread, setLoadingThread] = useState(isAuthenticated);
  const [draft, setDraft] = useState("");
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !chatId) return;
    try {
      const fetched = await resourcesApi.getMessages(chatId);
      setMessages(
        fetched.map((m: ChatMessage & { time: string }) => ({ ...m, time: formatClock(m.time) })),
      );
      setLoadingThread(false);
    } catch {
      setLoadingThread(false); // poll retries next round
    }
  }, [isAuthenticated, chatId]);

  // Load + 15s polling fallback; report as the active chat (no toasts for it)
  // and zero its unread counter while open.
  useEffect(() => {
    if (!isAuthenticated || !chatId) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate initial fetch on open
    load();
    setActiveChat(chatId);
    markChatRead(chatId);
    const interval = setInterval(load, 15_000);
    return () => {
      clearInterval(interval);
      setActiveChat(null);
    };
  }, [isAuthenticated, chatId, load, setActiveChat, markChatRead]);

  // Realtime receive — the other side's messages appear the moment they're sent.
  useEffect(() => {
    if (!isAuthenticated || !chatId) return undefined;
    return joinChatRoom(chatId, ({ message }) => {
      if (message.senderId === user?.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id)
          ? prev
          : [
              ...prev,
              {
                id: message.id,
                mine: false,
                text: message.text,
                image: message.image,
                sharedPost: message.sharedPost as SharedPostCard | null,
                time: formatClock(message.time),
              },
            ],
      );
    });
  }, [isAuthenticated, chatId, user?.id]);

  // Scroll ONLY the message pane to its newest message. (scrollIntoView would
  // scroll every ancestor — the whole page jumped down and hid the chat list,
  // the reported anomaly.)
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const deliver = async (payload: { text?: string; image?: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        mine: true,
        text: payload.text ?? "",
        image: payload.image ?? null,
        time: formatClock(),
      },
    ]);
    if (isAuthenticated && chatId) {
      try {
        await resourcesApi.sendMessage(chatId, payload);
      } catch (err) {
        window.alert(`Couldn't send: ${apiErrorMessage(err)}`);
      }
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    deliver({ text });
  };

  const sendPhoto = async (file: File) => {
    try {
      deliver({ image: await fileToCompressedDataUri(file) });
    } catch {
      window.alert("Couldn't read that image");
    }
  };

  return (
    // min-h-0 at every level: without it, a long thread makes the flex column
    // grow past the clipped card and the composer disappears below the fold
    // (the reported "message box nowhere" bug).
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {/* mobile: back to the conversation list (single-pane flow) */}
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-light-blue md:hidden"
        >
          <Icon name="left-arrow" size={16} />
        </Link>
        {chat.userId ? (
          <Link href={`/user/${chat.userId}`} className="flex items-center gap-3 hover:opacity-90">
            <UserAvatar name={chat.name} size={38} />
            <span className="text-step font-bold text-ink">{chat.name}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-3">
            <UserAvatar name={chat.name} size={38} />
            <span className="text-step font-bold text-ink">{chat.name}</span>
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {(["phone", "Video"] as const).map((icon) => (
            <button
              key={icon}
              aria-label={icon === "phone" ? "Voice call" : "Video call"}
              onClick={() =>
                window.alert("Audio/video calls arrive on the web in the W5 build phase — the app has them today.")
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-light-purple text-primary hover:opacity-90"
            >
              <Icon name={icon} size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loadingThread ? (
          <>
            <div className="flex justify-start"><SkeletonChatRow /></div>
            <div className="flex justify-end"><SkeletonChatRow /></div>
            <div className="flex justify-start"><SkeletonChatRow /></div>
          </>
        ) : null}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onImageClick={setViewerSrc} />
        ))}
      </div>

      {/* Fullscreen viewer: back + download, Esc/backdrop closes */}
      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-line px-4 py-3">
        <button
          aria-label="Send a photo"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-purple text-primary hover:opacity-90"
        >
          <Icon name="upload" size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendPhoto(file);
            e.target.value = "";
          }}
        />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write something supportive..."
          rows={1}
          className="max-h-28 flex-1 resize-none rounded-2xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          aria-label="Send"
          onClick={send}
          disabled={!draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
        >
          <Icon name="right-arrow" size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * The two-pane Messenger layout — conversation list beside the open thread
 * (the web's upgrade over the app's list→room navigation). On small screens
 * only one pane shows at a time.
 */
export default function ChatsWorkspace({ activeChatId }: { activeChatId?: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>(isAuthenticated ? [] : DEMO_CHATS);
  const [loadingChats, setLoadingChats] = useState(isAuthenticated);
  const [query, setQuery] = useState("");

  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fetched = await resourcesApi.getChats();
      setChats(
        fetched.map((c: ChatListItem & { time: string }) => ({ ...c, time: timeAgo(c.time), unread: c.unread ?? 0 })),
      );
      setLoadingChats(false);
    } catch {
      setLoadingChats(false); // honest empty state; next poll retries
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate initial fetch
    loadChats();
    const interval = setInterval(loadChats, 15_000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? chats.filter((c) => c.name.toLowerCase().includes(q) || c.last.toLowerCase().includes(q))
    : chats;

  const openChat = (chat: ChatListItem) => {
    if (chat.id) router.push(`/chats/${chat.id}`);
    else router.push("/chats"); // demo rows have no real conversation behind them
  };

  return (
    // dvh on mobile (browser chrome + bottom tab bar in play); vh on desktop.
    <div className="mx-auto h-[calc(100dvh-11rem)] max-w-5xl overflow-hidden rounded-2xl border border-line bg-card lg:h-[calc(100vh-6.5rem)]">
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)]">
        {/* List pane */}
        <div className={cn("min-h-0 flex-col overflow-hidden border-r border-line", activeChatId ? "hidden md:flex" : "flex")}>
          <div className="border-b border-line p-3">
            <h1 className="px-1 text-heading font-bold text-ink">Chats</h1>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className="mt-2 w-full rounded-full border border-line bg-light-blue px-3.5 py-2 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <>
                {[0, 1, 2, 3, 4].map((i) => (
                  <SkeletonChatRow key={i} />
                ))}
              </>
            ) : visible.length === 0 ? (
              <p className="p-4 text-center text-step text-muted">
                {q ? `No chats match "${query.trim()}".` : "No conversations yet — find a Sathi and say hello."}
              </p>
            ) : (
              visible.map((c) => (
                <button
                  key={c.id ?? c.name}
                  onClick={() => openChat(c)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-light-blue",
                    c.id && c.id === activeChatId && "bg-light-purple",
                  )}
                >
                  <UserAvatar name={c.name} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-step font-semibold text-ink">{c.name}</span>
                      <span className="shrink-0 text-caption text-muted">{c.time}</span>
                    </span>
                    <span className="block truncate text-caption text-muted">{c.last}</span>
                  </span>
                  {c.unread > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  ) : null}
                </button>
              ))
            )}
            {!isAuthenticated ? (
              <p className="p-3 text-center text-caption text-muted">
                Demo conversations — sign in to talk to your real sathis.
              </p>
            ) : null}
          </div>
        </div>

        {/* Thread pane */}
        <div className={cn("h-full min-h-0 overflow-hidden", activeChatId ? "block" : "hidden md:block")}>
          {activeChatId ? (
            <ChatThread
              key={activeChatId}
              chat={chats.find((c) => c.id === activeChatId) ?? { id: activeChatId, name: "Conversation", last: "", time: "", unread: 0 }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Icon name="chat" size={40} className="text-muted" />
              <p className="text-body font-semibold text-ink">Pick a conversation</p>
              <p className="max-w-xs text-step text-muted">
                Messages sync live with the app — send here, it lands on the phone instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
