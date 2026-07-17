"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { cn } from "@/lib/cn";

// The app's 5 tabs, same icon assets — phone browsers get the app's layout.
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/groups", label: "Groups", icon: "people" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/help", label: "Help", icon: "staff" },
  { href: "/profile", label: "Profile", icon: "user2" },
];

/**
 * Mobile-web bottom tab bar (<lg screens). Fixed above the home indicator
 * (safe-area inset), with the same live Chats unread badge as everywhere else.
 */
export default function BottomTabs() {
  const pathname = usePathname();
  const { unreadTotal } = useChatNotifications();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card lg:hidden"
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
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
