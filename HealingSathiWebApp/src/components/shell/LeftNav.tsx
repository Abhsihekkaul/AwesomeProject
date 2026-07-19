"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { useT, type StringKey } from "@/lib/i18n";

// The app's 5 tabs (same icon assets as its tab bar) + the screens it tucks
// behind Home quick actions.
const MAIN_ITEMS: { href: string; label: StringKey; icon: IconName }[] = [
  { href: "/feed", label: "home", icon: "home" },
  { href: "/groups", label: "groups", icon: "people" },
  { href: "/chats", label: "chats", icon: "chat" },
  { href: "/help", label: "help", icon: "staff" },
  { href: "/profile", label: "profile", icon: "user2" },
];

const MORE_ITEMS: { href: string; label: StringKey; icon: IconName }[] = [
  { href: "/diary", label: "healingDiary", icon: "post" },
  { href: "/tips", label: "healthTips", icon: "star" },
  { href: "/settings", label: "settings", icon: "setting" },
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
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-step font-medium transition-all duration-150",
      active
        ? "bg-light-purple font-semibold text-primary shadow-soft"
        : "text-ink hover:translate-x-0.5 hover:bg-light-blue",
    )}
  >
    {active ? (
      <span
        aria-hidden
        className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-primary-dark"
      />
    ) : null}
    <Icon name={icon} size={20} className={cn("transition-colors", active ? "text-primary" : "text-muted")} />
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
  const t = useT();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {MAIN_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          label={t(item.label)}
          active={isActive(item.href)}
          badge={item.href === "/chats" ? unreadTotal : 0}
        />
      ))}
      <div className="my-2 h-px bg-line" />
      {MORE_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} label={t(item.label)} active={isActive(item.href)} />
      ))}
    </nav>
  );
}
