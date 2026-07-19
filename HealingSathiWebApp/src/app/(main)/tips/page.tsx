"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import UserAvatar from "@/components/ui/UserAvatar";
import HealingHabits from "@/components/HealingHabits";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { DEMO_TIPS, type Tip } from "@/lib/tips";
import { cn } from "@/lib/cn";

// Quick, universal advice — the app's "basic health advice" strip, on web too.
const QUICK_WINS = [
  { id: "b1", glyph: "💧", text: "Sip water through the day — dehydration amplifies fatigue and brain fog." },
  { id: "b2", glyph: "😴", text: "Keep a fixed sleep window; consistency beats duration." },
  { id: "b3", glyph: "🚶", text: "A 10-minute gentle walk counts. Movement is medicine, dosage matters." },
  { id: "b4", glyph: "🧘", text: "60 seconds of slow breathing lowers your stress response measurably." },
  { id: "b5", glyph: "🥗", text: "Add one vegetable to a meal today — small swaps stick." },
];

const TYPE_GLYPH: Record<string, string> = {
  Article: "📄",
  Video: "🎥",
  "Photo Guide": "🖼️",
};

const QUICK_TINTS = ["bg-light-purple", "bg-light-blue", "bg-light-green", "bg-light-orange"];

/** Deterministic per-day pick, so everyone sees the same "tip of the day". */
const dailyPick = (tips: Tip[]) => {
  if (tips.length === 0) return null;
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  return tips[dayOfYear % tips.length];
};

function TipCard({ tip, journey }: { tip: Tip; journey: boolean }) {
  return (
    <Link
      href={`/tips/${tip.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-card p-4 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-purple text-base"
        >
          {TYPE_GLYPH[tip.type] ?? "📄"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-bold text-primary">{tip.type}</p>
          {tip.duration ? <p className="text-caption text-muted">{tip.duration}</p> : null}
        </div>
        {journey ? (
          <span className="shrink-0 rounded-full bg-light-green px-2 py-0.5 text-[10px] font-bold text-success">
            For your journey
          </span>
        ) : null}
      </div>

      <h2 className="mt-2.5 text-step leading-snug font-bold text-ink group-hover:text-primary">
        {tip.title}
      </h2>
      {tip.summary ? (
        <p className="mt-1 flex-1 text-caption leading-snug text-muted">{tip.summary}</p>
      ) : (
        <span className="flex-1" />
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
        <UserAvatar name={tip.author.replace("Dr. ", "")} size={24} />
        <span className="min-w-0 flex-1 truncate text-caption font-medium text-ink">
          {tip.author}
        </span>
        <span className="shrink-0 rounded-full bg-light-purple px-2.5 py-0.5 text-[10px] font-bold text-primary">
          {tip.condition}
        </span>
      </div>
    </Link>
  );
}

/**
 * Health Tips v3: every card opens its own page (/tips/[id]) with the full
 * article + questions, and tips matching the signed-in user's conditions lead
 * the screen — "For your journey" first, everything else after.
 */
export default function TipsPage() {
  const { user } = useAuth();
  const [condition, setCondition] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { data: tips, loading } = useLiveData<Tip[]>(
    ["tips"],
    async () => resourcesApi.getHealthTips(),
    DEMO_TIPS,
  );

  const conditionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tips) counts.set(t.condition, (counts.get(t.condition) ?? 0) + 1);
    return counts;
  }, [tips]);

  // Case-insensitive overlap between a tip's condition and the user's saved ones.
  const myConditions = (user?.conditions ?? []).map((c) => c.toLowerCase());
  const matchesJourney = (tip: Tip) =>
    myConditions.some(
      (c) => tip.condition.toLowerCase().includes(c) || c.includes(tip.condition.toLowerCase()),
    );

  const q = query.trim().toLowerCase();
  const filtered = tips.filter(
    (t) =>
      (!condition || t.condition === condition) &&
      (!q ||
        [t.title, t.summary, t.author, t.condition].some((field) =>
          field.toLowerCase().includes(q),
        )),
  );
  const journeyTips = filtered.filter(matchesJourney);
  const otherTips = filtered.filter((t) => !matchesJourney(t));

  // The hero prefers a tip about YOUR conditions when any exist.
  const featured = dailyPick(tips.filter(matchesJourney)) ?? dailyPick(tips);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-heading font-bold text-ink">Health Tips</h1>
        <p className="text-step text-muted">Doctor-written guidance for your conditions.</p>
      </div>

      {/* Gamification: today's checklist + Healing Points + the circle's progress */}
      <HealingHabits />

      {/* Tip of the day — the shelf's front cover */}
      {loading ? (
        <Skeleton className="h-36 w-full rounded-3xl" />
      ) : featured ? (
        <Link
          href={`/tips/${featured.id}`}
          className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-lift transition-transform duration-150 hover:-translate-y-0.5"
        >
          <span aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-14 -left-6 h-36 w-36 rounded-full bg-white/5" />
          <p className="text-caption font-bold tracking-wide uppercase opacity-90">
            ✨ Tip of the day{matchesJourney(featured) ? " · for your journey" : ""}
          </p>
          <h2 className="mt-1.5 text-subtitle leading-snug font-bold">{featured.title}</h2>
          {featured.summary ? (
            <p className="mt-1 max-w-lg text-step leading-snug opacity-90">{featured.summary}</p>
          ) : null}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-caption font-semibold">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5">
              {TYPE_GLYPH[featured.type] ?? "📄"} {featured.type}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5">{featured.condition}</span>
            <span className="opacity-90">
              {featured.author}
              {featured.duration ? ` · ${featured.duration}` : ""}
            </span>
            <span className="ml-auto opacity-90">Read →</span>
          </p>
        </Link>
      ) : null}

      {/* Quick wins — things anyone can do today */}
      <section>
        <h2 className="mb-2 text-step font-bold text-ink">Quick wins</h2>
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1.5">
          {QUICK_WINS.map((w, i) => (
            <div
              key={w.id}
              className={cn(
                "w-44 shrink-0 rounded-2xl p-3 shadow-soft",
                QUICK_TINTS[i % QUICK_TINTS.length],
              )}
            >
              <span aria-hidden className="text-lg">{w.glyph}</span>
              <p className="mt-1.5 text-caption leading-snug text-ink">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tips — condition, topic, author..."
        aria-label="Search health tips"
        className="w-full rounded-full border border-line bg-light-blue px-4 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
      />

      {conditionCounts.size > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCondition(null)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-caption font-semibold transition-colors",
              !condition ? "border-primary bg-primary text-white" : "border-line bg-card text-muted hover:text-ink",
            )}
          >
            All · {tips.length}
          </button>
          {[...conditionCounts.entries()].map(([c, count]) => (
            <button
              key={c}
              onClick={() => setCondition(condition === c ? null : c)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-caption font-semibold transition-colors",
                condition === c ? "border-primary bg-primary text-white" : "border-line bg-card text-muted hover:text-ink",
              )}
            >
              {c} · {count}
            </button>
          ))}
        </div>
      ) : null}

      {/* The shelf — your conditions lead, everything else follows */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {journeyTips.length > 0 ? (
            <section>
              <h2 className="mb-2 text-step font-bold text-ink">For your journey</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {journeyTips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} journey />
                ))}
              </div>
            </section>
          ) : null}
          {otherTips.length > 0 ? (
            <section>
              {journeyTips.length > 0 ? (
                <h2 className="mb-2 text-step font-bold text-ink">More tips</h2>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {otherTips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} journey={false} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted shadow-soft">
          {q || condition ? "No tips match your search." : "No tips published yet."}
        </p>
      ) : null}
    </div>
  );
}
