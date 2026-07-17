"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

/**
 * The persistent top bar: brand, global search (live in W4), chat +
 * notification bells (badges join in W3), avatar menu with theme + sign out.
 */
export default function TopBar() {
  const router = useRouter();
  const { user, isDemo, signOut } = useAuth();
  const { setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/feed" className="shrink-0 text-lg font-bold text-primary">
          HealingSathi
        </Link>

        <div className="flex-1">
          <input
            placeholder="Search people, groups, consultants..."
            className="w-full max-w-md rounded-full border border-line bg-light-blue px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            onFocus={() => router.push("/search")}
            readOnly
          />
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/chats"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary hover:bg-light-purple"
            aria-label="Chats"
          >
            <Icon name="chat" size={17} />
          </Link>
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary hover:bg-light-purple"
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
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-card p-2 shadow-lg">
                  <div className="border-b border-line px-3 pb-2">
                    <p className="text-sm font-semibold text-ink">
                      {user?.name ?? "Demo mode"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {user?.email ?? "Sign in for your real circles"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-ink">Theme</span>
                    <span className="flex gap-1">
                      {(["system", "light", "dark"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setTheme(mode)}
                          className="rounded-md bg-light-blue px-2 py-1 text-xs font-medium text-ink capitalize hover:bg-light-purple"
                        >
                          {mode}
                        </button>
                      ))}
                    </span>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-light-blue"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-light-blue"
                  >
                    {user ? "Sign out" : "Exit demo"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
