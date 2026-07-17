"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

const MODES = [
  { key: "light", label: "☀️", title: "Light" },
  { key: "dark", label: "🌙", title: "Dark" },
  { key: "system", label: "💻", title: "System" },
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

  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-line bg-card p-1", className)}>
      {MODES.map((mode) => (
        <button
          key={mode.key}
          title={mode.title}
          aria-label={`${mode.title} theme`}
          onClick={() => setTheme(mode.key)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors",
            theme === mode.key ? "bg-light-purple" : "hover:bg-light-blue",
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
