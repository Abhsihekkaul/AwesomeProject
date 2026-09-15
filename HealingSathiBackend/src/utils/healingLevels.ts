/**
 * The Healing Points badge ladder — the single source of truth (clients render
 * whatever this returns, so tuning thresholds is a backend-only change).
 * Healing-language names, deliberately not competitive-sounding: you level up
 * against your own health, not against other people.
 */
// The long game (user-tuned): with a perfect day = 15 points, Sprout lands in
// ~2 weeks of steady effort and Luminary takes a bit over a year of
// near-perfect days — a rank that genuinely means something in the community.
export const HEALING_LEVELS = [
  { level: 1, name: "Seedling", icon: "🌱", min: 0 },
  { level: 2, name: "Sprout", icon: "🌿", min: 150 },
  { level: 3, name: "Bloom", icon: "🌸", min: 600 },
  { level: 4, name: "Glow", icon: "✨", min: 1500 },
  { level: 5, name: "Radiant", icon: "🌟", min: 3000 },
  { level: 6, name: "Luminary", icon: "🌞", min: 6000 },
] as const;

export type Badge = (typeof HEALING_LEVELS)[number];

/** Current badge + the next rung (null at the top). */
export const badgeFor = (points: number) => {
  let current: Badge = HEALING_LEVELS[0];
  for (const lvl of HEALING_LEVELS) {
    if (points >= lvl.min) current = lvl;
  }
  const next = HEALING_LEVELS.find((lvl) => lvl.min > points) ?? null;
  return {
    badge: current,
    nextBadge: next ? { name: next.name, icon: next.icon, at: next.min } : null,
  };
};
