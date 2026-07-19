"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

const MODES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "Auto" },
] as const;

/**
 * Three-way theme switch (same System/Light/Dark trio as the app's Settings).
 * Renders only after mount — next-themes' value isn't known during SSR and
 * rendering a guess would flash the wrong active pill.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Standard next-themes hydration guard: the active theme is unknowable
  // server-side, so render nothing until mounted.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Same segmented-pill control as the account menu — one theme-switch
  // style everywhere instead of emoji buttons.
  return (
    <div className={cn("flex items-center rounded-full border border-line bg-card p-1 shadow-soft", className)} role="group" aria-label="Theme">
      {MODES.map((mode) => (
        <button
          key={mode.key}
          aria-label={`${mode.label} theme`}
          onClick={() => setTheme(mode.key)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            theme === mode.key ? "bg-light-purple text-primary" : "text-muted hover:text-ink",
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
