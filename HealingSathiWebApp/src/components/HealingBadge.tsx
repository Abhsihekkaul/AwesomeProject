"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { cn } from "@/lib/cn";

/**
 * Your Healing Points badge — shown on /profile. The ladder lives on the
 * backend (utils/healingLevels.ts); this just renders whatever it says.
 * People chase their own better health here, not each other: progress bar to
 * YOUR next level, no comparisons.
 */

type Level = { level: number; name: string; icon: string; min: number };
type BadgeInfo = {
  points: { total: number };
  badge: { level: number; name: string; icon: string; min: number };
  nextBadge: { name: string; icon: string; at: number } | null;
  levels?: Level[];
};

// Mirrors the backend's HEALING_LEVELS — demo display + fallback only; live
// mode always renders what the server sends.
const LADDER: Level[] = [
  { level: 1, name: "Seedling", icon: "🌱", min: 0 },
  { level: 2, name: "Sprout", icon: "🌿", min: 150 },
  { level: 3, name: "Bloom", icon: "🌸", min: 600 },
  { level: 4, name: "Glow", icon: "✨", min: 1500 },
  { level: 5, name: "Radiant", icon: "🌟", min: 3000 },
  { level: 6, name: "Luminary", icon: "🌞", min: 6000 },
];

const DEMO_BADGE: BadgeInfo = {
  points: { total: 460 },
  badge: { level: 2, name: "Sprout", icon: "🌿", min: 150 },
  nextBadge: { name: "Bloom", icon: "🌸", at: 600 },
  levels: LADDER,
};

export default function HealingBadge() {
  const { data } = useLiveData<BadgeInfo>(
    ["habits-today"],
    async () => resourcesApi.getHabitsToday(),
    DEMO_BADGE,
    { emptyData: DEMO_BADGE },
  );

  const badge = data.badge ?? DEMO_BADGE.badge;
  const next = data.nextBadge;
  const points = data.points?.total ?? 0;
  // Progress within the current rung.
  const span = next ? next.at - badge.min : 1;
  const progress = next ? Math.min(1, (points - badge.min) / span) : 1;

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-light-purple to-light-blue text-2xl"
        >
          {badge.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-step font-bold text-ink">
            {badge.name}
            <span className="ml-2 rounded-full bg-light-purple px-2 py-0.5 text-[10px] font-bold text-primary">
              Level {badge.level}
            </span>
          </p>
          <p className="text-caption text-muted">✨ {points} Healing Points</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-light-blue">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-caption text-muted">
        {next
          ? `${next.icon} ${next.name} at ${next.at} points — ${next.at - points} to go`
          : "Top of the ladder — a Luminary of the circle 🌞"}
      </p>

      {/* The whole ladder — everyone should know the missions ahead */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-line pt-3 sm:grid-cols-6">
        {(data.levels ?? LADDER).map((lvl) => {
          const achieved = points >= lvl.min;
          const current = lvl.level === badge.level;
          return (
            <div
              key={lvl.level}
              title={`${lvl.name} — ${lvl.min}+ points`}
              className={cn(
                "flex flex-col items-center rounded-xl px-1 py-2 text-center",
                current
                  ? "bg-light-purple ring-1 ring-primary"
                  : achieved
                    ? "bg-light-purple/50"
                    : "bg-page opacity-70",
              )}
            >
              <span aria-hidden className={cn("text-base", !achieved && "grayscale")}>
                {lvl.icon}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[10px] font-bold",
                  current ? "text-primary" : achieved ? "text-ink" : "text-muted",
                )}
              >
                {lvl.name}
              </span>
              <span className="text-[9px] font-semibold text-muted">
                {achieved && !current ? "✓" : `${lvl.min}+`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
