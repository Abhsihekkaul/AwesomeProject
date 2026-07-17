"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { authApi } from "@/api/authApi";
import { resourcesApi } from "@/api/resourcesApi";
import { connectAppSocket, disconnectAppSocket, getAppSocket } from "@/api/appSocket";

/**
 * Web edition of the app's message-notification engine — same state machine:
 *
 *  - Listens for `chat:updated` on the app socket (the server sends it to every
 *    device of the OTHER participant on each message).
 *  - Tracks the unread total for the left-nav/top-bar badges AND the browser
 *    tab title ("(3) HealingSathi") — web's equivalent of the app-icon badge.
 *  - Shows an in-page toast; when the TAB IS HIDDEN it also fires a browser
 *    Notification (permission asked once) — web gets "push" before the app.
 *  - Never notifies for the conversation currently on screen (the open chat
 *    reports itself active and auto-marks incoming messages read).
 *  - The on/off preference is the SAME account flag the app's Settings toggle
 *    writes (notifyOnMessages via PATCH /auth/me).
 */

const BANNER_MS = 4500;

export type MessageToast = {
  chatId: string;
  fromUserId?: string;
  fromName: string;
  preview: string;
};

type ChatNotificationsValue = {
  unreadTotal: number;
  toast: MessageToast | null;
  dismissToast: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setActiveChat: (chatId: string | null) => void;
  markChatRead: (chatId: string) => void;
  refreshUnread: () => void;
};

const ChatNotificationsContext = createContext<ChatNotificationsValue | null>(null);

export const ChatNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [toast, setToast] = useState<MessageToast | null>(null);
  const [notificationsEnabled, setEnabledState] = useState(true);

  const activeChatRef = useRef<string | null>(null);
  const enabledRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Socket handlers read the toggle through a ref so the listener never has to
  // re-subscribe when it flips.
  useEffect(() => {
    enabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  // The account flag travels in every auth payload — adopt it on sign-in.
  useEffect(() => {
    if (typeof user?.notifyOnMessages === "boolean") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- adopting the server's value
      setEnabledState(user.notifyOnMessages);
    }
  }, [user?.notifyOnMessages]);

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setEnabledState(enabled);
      if (isAuthenticated) authApi.updateMe({ notifyOnMessages: enabled }).catch(() => {});
    },
    [isAuthenticated],
  );

  const refreshUnread = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadTotal(0);
      return;
    }
    resourcesApi
      .getChats()
      .then((chats: { unread?: number }[]) =>
        setUnreadTotal(chats.reduce((sum, c) => sum + (Number(c.unread) || 0), 0)),
      )
      .catch(() => {});
  }, [isAuthenticated]);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const markChatRead = useCallback(
    (chatId: string) => {
      if (!isAuthenticated || !chatId) return;
      resourcesApi
        .markChatRead(chatId)
        .then(refreshUnread)
        .catch(() => {});
    },
    [isAuthenticated, refreshUnread],
  );

  const setActiveChat = useCallback((chatId: string | null) => {
    activeChatRef.current = chatId;
  }, []);

  // Tab title carries the unread count — visible from any other tab.
  useEffect(() => {
    document.title = unreadTotal > 0 ? `(${unreadTotal}) HealingSathi` : "HealingSathi";
  }, [unreadTotal]);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sign-out reset, runs once per auth flip
      setUnreadTotal(0);
      setToast(null);
      return undefined;
    }

    refreshUnread();
    // Ask once, politely, so background-tab notifications can work at all.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let disposed = false;
    const onChatUpdated = (payload: {
      chatId?: string;
      last?: string;
      fromUserId?: string;
      fromName?: string;
    }) => {
      const chatId = String(payload?.chatId ?? "");
      if (!chatId) return;
      if (chatId === activeChatRef.current) {
        resourcesApi.markChatRead(chatId).catch(() => {});
        return;
      }
      refreshUnread();
      if (!enabledRef.current) return;

      const fromName = payload?.fromName ?? "New message";
      const preview = payload?.last ?? "";

      if (
        document.hidden &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        // Backgrounded tab → OS-level notification, tagged per chat so a chatty
        // sathi replaces their own notification instead of stacking dozens.
        const n = new Notification(fromName, { body: preview, tag: `chat-${chatId}` });
        n.onclick = () => {
          window.focus();
          window.location.href = `/chats/${chatId}`;
        };
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ chatId, fromUserId: payload?.fromUserId, fromName, preview });
        timerRef.current = setTimeout(() => setToast(null), BANNER_MS);
      }
    };

    (async () => {
      const socket = await connectAppSocket();
      if (!socket || disposed) return;
      socket.on("chat:updated", onChatUpdated);
    })();

    return () => {
      disposed = true;
      getAppSocket()?.off("chat:updated", onChatUpdated);
      disconnectAppSocket();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [isAuthenticated, refreshUnread]);

  const value = useMemo(
    () => ({
      unreadTotal,
      toast,
      dismissToast,
      notificationsEnabled,
      setNotificationsEnabled,
      setActiveChat,
      markChatRead,
      refreshUnread,
    }),
    [unreadTotal, toast, dismissToast, notificationsEnabled, setNotificationsEnabled, setActiveChat, markChatRead, refreshUnread],
  );

  return (
    <ChatNotificationsContext.Provider value={value}>
      {children}
    </ChatNotificationsContext.Provider>
  );
};

export const useChatNotifications = () => {
  const ctx = useContext(ChatNotificationsContext);
  if (!ctx) throw new Error("useChatNotifications must be used within its provider");
  return ctx;
};
