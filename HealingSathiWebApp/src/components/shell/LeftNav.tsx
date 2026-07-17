"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

// The app's 5 tabs + the screens it tucks behind Home quick actions.
const MAIN_ITEMS = [
  { href: "/feed", label: "Home", icon: "🏠" },
  { href: "/groups", label: "Groups", icon: "👥" },
  { href: "/chats", label: "Chats", icon: "💬" },
  { href: "/help", label: "Help", icon: "🩺" },
  { href: "/profile", label: "Profile", icon: "🧑" },
];

const MORE_ITEMS = [
  { href: "/diary", label: "Healing Diary", icon: "📔" },
  { href: "/tips", label: "Health Tips", icon: "💡" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
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
  icon: string;
  active: boolean;
  badge?: number;
}) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-light-purple text-primary" : "text-ink hover:bg-light-blue",
    )}
  >
    <span className="text-lg leading-none" aria-hidden>
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    {badge && badge > 0 ? (
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
        {badge > 99 ? "99+" : badge}
      </span>
    ) : null}
  </Link>
);

/**
 * Desktop left column. The Chats badge joins in W3 when the
 * ChatNotifications provider lands (same unread source as the app's tab bar).
 */
export default function LeftNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {MAIN_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}
      <div className="my-2 h-px bg-line" />
      {MORE_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}
