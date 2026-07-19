"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { cn } from "@/lib/cn";
import { useT, type StringKey } from "@/lib/i18n";

// The app's 5 tabs, same icon assets — phone browsers get the app's layout.
const TABS: { href: string; label: StringKey; icon: IconName }[] = [
  { href: "/feed", label: "home", icon: "home" },
  { href: "/groups", label: "groups", icon: "people" },
  { href: "/chats", label: "chats", icon: "chat" },
  { href: "/help", label: "help", icon: "staff" },
  { href: "/profile", label: "profile", icon: "user2" },
];

/**
 * Mobile-web bottom tab bar (<lg screens). Fixed above the home indicator
 * (safe-area inset), with the same live Chats unread badge as everywhere else.
 */
export default function BottomTabs() {
  const pathname = usePathname();
  const { unreadTotal } = useChatNotifications();
  const t = useT();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/85 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5",
                active ? "text-primary" : "text-muted",
              )}
            >
              <span className="relative">
                <Icon name={tab.icon} size={21} />
                {tab.href === "/chats" && unreadTotal > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-medium">{t(tab.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
