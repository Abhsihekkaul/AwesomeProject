"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * The persistent top bar: brand, global search (live in W4), chat +
 * notification bells (badges join in W3), avatar menu with theme + sign out.
 */
export default function TopBar() {
  const router = useRouter();
  const { user, isDemo, signOut } = useAuth();
  const { unreadTotal } = useChatNotifications();
  const { theme, setTheme } = useTheme();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/80 shadow-soft backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/feed" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-lg font-bold text-white shadow-sm shadow-primary/30"
          >
            ∞
          </span>
          <span className="hidden bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-lg font-bold text-transparent sm:block">
            HealingSathi
          </span>
        </Link>

        <div className="flex-1">
          <input
            placeholder={t("searchPlaceholder")}
            className="w-full max-w-md rounded-full border border-line bg-light-blue px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            onFocus={() => router.push("/search")}
            readOnly
          />
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/chats"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary transition-all hover:scale-105 hover:bg-light-purple"
            aria-label="Chats"
          >
            <Icon name="chat" size={17} />
            {unreadTotal > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </Link>
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary transition-all hover:scale-105 hover:bg-light-purple"
            aria-label="Notifications"
          >
            <Icon name="notification" size={17} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              className="block rounded-full ring-primary focus:outline-none focus:ring-2"
            >
              <UserAvatar name={user?.name ?? (isDemo ? "Demo" : "?")} src={user?.avatarUrl} size={36} />
            </button>

            {menuOpen ? (
              <>
                {/* click-away layer */}
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <div className="animate-fade-up absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
                  {/* Identity header — tap-through to your profile */}
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 bg-gradient-to-br from-light-purple/70 to-light-blue/60 px-4 py-3.5 transition-colors hover:from-light-purple hover:to-light-blue"
                  >
                    <UserAvatar
                      name={user?.name ?? (isDemo ? "Demo" : "?")}
                      src={user?.avatarUrl}
                      color={user?.avatarColor}
                      size={40}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">
                        {user?.name ?? "Demo mode"}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {user?.email ?? "Sign in for your real circles"}
                      </span>
                      <span className="text-xs font-semibold text-primary">{t("viewProfile")}</span>
                    </span>
                  </Link>

                  <div className="p-2">
                    {/* Theme — one segmented control, not three loose chips */}
                    <div className="flex rounded-full bg-light-blue p-1" role="group" aria-label="Theme">
                      {(["system", "light", "dark"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setTheme(mode)}
                          className={cn(
                            "flex-1 rounded-full py-1.5 text-xs font-semibold capitalize transition-colors",
                            theme === mode ? "bg-card text-primary shadow-soft" : "text-muted hover:text-ink",
                          )}
                        >
                          {mode === "system" ? t("themeAuto") : mode === "light" ? t("themeLight") : t("themeDark")}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-light-blue"
                      >
                        <Icon name="setting" size={16} className="text-muted" />
                        {t("settings")}
                      </Link>
                      <Link
                        href="/diary"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-light-blue"
                      >
                        <Icon name="post" size={16} className="text-muted" />
                        {t("healingDiary")}
                      </Link>
                    </div>

                    <div className="mt-1 border-t border-line pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                      >
                        ⎋ {user ? t("signOut") : t("exitDemo")}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
