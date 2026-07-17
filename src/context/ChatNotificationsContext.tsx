import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { authApi } from "../api/authApi";
import { resourcesApi } from "../api/resourcesApi";
import { connectAppSocket, disconnectAppSocket, getAppSocket } from "../api/appSocket";

/**
 * Message-notification engine, app-wide while signed in:
 *
 *  - Listens for `chat:updated` on the shared app socket (the server sends it to
 *    every device of the OTHER participant on each message) and shows an in-app
 *    popup banner — unless you're already inside that conversation, or you've
 *    turned chat notifications off in Settings.
 *  - Tracks the total unread-message count for the Chats tab badge (server-side
 *    counters on the conversation; opening a chat zeroes its counter).
 *  - Owns the on/off preference: persisted on-device for instant boot AND on the
 *    account (PATCH /auth/me { notifyOnMessages }), so the backend also stops
 *    writing Notifications-page entries while it's off.
 */

const PREF_KEY = "chatNotificationsEnabled";
const BANNER_MS = 4500;

export type MessageBanner = {
  chatId: string;
  fromUserId?: string;
  fromName: string;
  preview: string;
};

type ChatNotificationsValue = {
  /** Sum of unread messages across all conversations — the Chats tab badge. */
  unreadTotal: number;
  /** Popup banner currently on screen (null = none). */
  banner: MessageBanner | null;
  dismissBanner: () => void;
  /** Chat notifications toggle (Settings). */
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  /** ChatRoom reports the conversation it's showing so its messages never pop up. */
  setActiveChat: (chatId: string | null) => void;
  /** Zeroes a conversation's unread counter (server + badge). */
  markChatRead: (chatId: string) => void;
  refreshUnread: () => void;
};

const ChatNotificationsContext = createContext<ChatNotificationsValue | null>(null);

export const ChatNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [banner, setBanner] = useState<MessageBanner | null>(null);
  const [notificationsEnabled, setEnabledState] = useState(true);

  const activeChatRef = useRef<string | null>(null);
  const enabledRef = useRef(true);
  enabledRef.current = notificationsEnabled;
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preference boots from device storage; the account value (in every auth payload)
  // wins once a session exists, so it follows the user across devices.
  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY)
      .then((stored) => {
        if (stored !== null) setEnabledState(stored === "true");
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (typeof user?.notifyOnMessages === "boolean") setEnabledState(user.notifyOnMessages);
  }, [user?.notifyOnMessages]);

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setEnabledState(enabled);
      AsyncStorage.setItem(PREF_KEY, String(enabled)).catch(() => {});
      // Server-side too, so Notifications-page entries stop while it's off.
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
      .then((chats: any[]) =>
        setUnreadTotal(chats.reduce((sum, c) => sum + (Number(c.unread) || 0), 0)),
      )
      .catch(() => {});
  }, [isAuthenticated]);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = null;
    setBanner(null);
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

  // App-wide socket listener while signed in (shares the CallProvider's socket;
  // connectAppSocket is idempotent and CallProvider owns the disconnect on sign-out).
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadTotal(0);
      setBanner(null);
      return undefined;
    }

    refreshUnread();

    let disposed = false;
    const onChatUpdated = (payload: any) => {
      const chatId = String(payload?.chatId ?? "");
      if (!chatId) return;
      if (chatId === activeChatRef.current) {
        // Already reading this conversation — no popup, and the counter the server
        // just incremented gets zeroed right back.
        resourcesApi.markChatRead(chatId).catch(() => {});
        return;
      }
      refreshUnread();
      if (!enabledRef.current) return;
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      setBanner({
        chatId,
        fromUserId: payload?.fromUserId,
        fromName: payload?.fromName ?? "New message",
        preview: payload?.last ?? "",
      });
      bannerTimerRef.current = setTimeout(() => setBanner(null), BANNER_MS);
    };

    (async () => {
      const socket = await connectAppSocket();
      if (!socket || disposed) return;
      socket.on("chat:updated", onChatUpdated);
    })();

    return () => {
      disposed = true;
      getAppSocket()?.off("chat:updated", onChatUpdated);
      // Runs only on sign-out/unmount. CallProvider also disconnects when WebRTC is
      // linked; before that rebuild this is the only place that closes the socket.
      disconnectAppSocket();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    };
  }, [isAuthenticated, refreshUnread]);

  const value = useMemo(
    () => ({
      unreadTotal,
      banner,
      dismissBanner,
      notificationsEnabled,
      setNotificationsEnabled,
      setActiveChat,
      markChatRead,
      refreshUnread,
    }),
    [
      unreadTotal, banner, dismissBanner, notificationsEnabled,
      setNotificationsEnabled, setActiveChat, markChatRead, refreshUnread,
    ],
  );

  return (
    <ChatNotificationsContext.Provider value={value}>
      {children}
    </ChatNotificationsContext.Provider>
  );
};

export const useChatNotifications = () => {
  const ctx = useContext(ChatNotificationsContext);
  if (!ctx) throw new Error("useChatNotifications must be used within a ChatNotificationsProvider");
  return ctx;
};
