"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useChatNotifications } from "@/context/ChatNotificationsContext";

// The app's 5 tabs (same icon assets as its tab bar) + the screens it tucks
// behind Home quick actions.
const MAIN_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/groups", label: "Groups", icon: "people" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/help", label: "Help", icon: "staff" },
  { href: "/profile", label: "Profile", icon: "user2" },
];

const MORE_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/diary", label: "Healing Diary", icon: "post" },
  { href: "/tips", label: "Health Tips", icon: "star" },
  { href: "/settings", label: "Settings", icon: "setting" },
];

const NavLink = ({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  badge?: number;
}) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-step font-medium transition-colors",
      active ? "bg-light-purple text-primary" : "text-ink hover:bg-light-blue",
    )}
  >
    <Icon name={icon} size={20} className={active ? "text-primary" : "text-muted"} />
    <span className="flex-1">{label}</span>
    {badge && badge > 0 ? (
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
        {badge > 99 ? "99+" : badge}
      </span>
    ) : null}
  </Link>
);

/**
 * Desktop left column. The Chats badge is the same unread total the app's
 * tab bar shows — one server-side counter drives both products.
 */
export default function LeftNav() {
  const pathname = usePathname();
  const { unreadTotal } = useChatNotifications();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {MAIN_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={isActive(item.href)}
          badge={item.href === "/chats" ? unreadTotal : 0}
        />
      ))}
      <div className="my-2 h-px bg-line" />
      {MORE_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}
