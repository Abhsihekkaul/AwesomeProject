"use client";

import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import { useChatNotifications } from "@/context/ChatNotificationsContext";

/**
 * In-page "new message" toast (the app's ChatMessageBanner): slides in top-right,
 * click → jump into that conversation, ✕ or ~4.5s auto-dismiss.
 */
export default function ChatToast() {
  const router = useRouter();
  const { toast, dismissToast } = useChatNotifications();

  if (!toast) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-80 animate-[slideIn_.2s_ease-out] rounded-2xl border border-line bg-card p-3 shadow-lg">
      <button
        className="flex w-full items-center gap-3 text-left"
        onClick={() => {
          dismissToast();
          router.push(`/chats/${toast.chatId}`);
        }}
      >
        <UserAvatar name={toast.fromName} size={38} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-step font-bold text-ink">{toast.fromName}</span>
          <span className="block truncate text-caption text-muted">{toast.preview}</span>
        </span>
      </button>
      <button
        aria-label="Dismiss"
        onClick={dismissToast}
        className="absolute top-2 right-2 text-caption font-bold text-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
