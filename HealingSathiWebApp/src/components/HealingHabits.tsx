"use client";

import { useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { cn } from "@/lib/cn";

/**
 * Healing Habits — the gamification card at the top of Health Tips.
 * Tick the day's checklist, earn Healing Points (10/task, +20 full day),
 * watch the month fill in, and see + cheer your sathis' progress.
 * Gentle by design: empty days are just empty, never red.
 */

type HabitTask = { key: string; label: string; done: boolean };
type HabitsToday = {
  day: string;
  tasks: HabitTask[];
  points: { today: number; month: number; total: number; perTask: number; fullDayBonus: number };
  month: { day: string; completed: number; total: number }[];
};
type CircleEntry = {
  user: { id: string; name: string; avatarColor?: string; avatarUrl?: string | null };
  todayCompleted: number;
  todayTotal: number;
  monthPoints: number;
  cheeredToday: boolean;
};

const DEMO_TODAY: HabitsToday = {
  day: new Date().toISOString().slice(0, 10),
  tasks: [
    { key: "water", label: "Drink 2–4 litres of water", done: true },
    { key: "sleep", label: "Sleep 7–8 hours", done: true },
    { key: "walk", label: "Take a 30-minute walk", done: false },
    { key: "breathe", label: "60 seconds of slow breathing", done: false },
    { key: "veg", label: "Eat one extra fruit or vegetable", done: false },
  ],
  points: { today: 2, month: 42, total: 180, perTask: 1, fullDayBonus: 10 },
  month: [],
};

const DEMO_CIRCLE: CircleEntry[] = [
  { user: { id: "d1", name: "Alex K." }, todayCompleted: 4, todayTotal: 5, monthPoints: 46, cheeredToday: false },
  { user: { id: "d2", name: "Maya Harrison" }, todayCompleted: 2, todayTotal: 5, monthPoints: 28, cheeredToday: true },
];

export default function HealingHabits() {
  const { isAuthenticated } = useAuth();

  const { data: today, refresh } = useLiveData<HabitsToday>(
    ["habits-today"],
    async () => resourcesApi.getHabitsToday(),
    DEMO_TODAY,
    { emptyData: DEMO_TODAY, pollMs: 60_000 },
  );

  const { data: circle, refresh: refreshCircle } = useLiveData<CircleEntry[]>(
    ["habits-circle"],
    async () => resourcesApi.getHabitsCircle(),
    DEMO_CIRCLE,
    { pollMs: 60_000 },
  );

  // Optimistic tick overlay — the API + refresh reconcile shortly after.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const isDone = (t: HabitTask) => overrides[t.key] ?? t.done;
  const doneCount = today.tasks.filter(isDone).length;
  const allDone = doneCount >= today.tasks.length;
  const pointsToday =
    doneCount * today.points.perTask + (allDone ? today.points.fullDayBonus : 0);

  const toggle = async (t: HabitTask) => {
    if (!isAuthenticated) {
      setNotice("Sign in to start collecting Healing Points — your circle will see your progress.");
      return;
    }
    setOverrides((o) => ({ ...o, [t.key]: !isDone(t) }));
    try {
      await resourcesApi.toggleHabit(t.key);
      refresh();
    } catch {
      setOverrides((o) => ({ ...o, [t.key]: isDone(t) }));
    }
  };

  const cheer = async (entry: CircleEntry) => {
    if (!isAuthenticated || entry.cheeredToday) return;
    try {
      await resourcesApi.cheerHabits(entry.user.id);
      refreshCircle();
    } catch {
      /* the button simply stays available */
    }
  };

  // The month strip: one dot per day so far this month.
  const dayOfMonth = Number(today.day.slice(8, 10));
  const monthByDay = new Map(today.month.map((m) => [Number(m.day.slice(8, 10)), m]));

  return (
    <section className="rounded-3xl border border-line bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-step font-bold text-ink">🌱 Daily healing habits</h2>
        <span className="ml-auto rounded-full bg-light-purple px-3 py-1 text-caption font-bold text-primary">
          ✨ {today.points.total + (pointsToday - today.points.today)} Healing Points
        </span>
      </div>

      {/* Today's progress */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-light-blue">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
            style={{ width: `${(doneCount / today.tasks.length) * 100}%` }}
          />
        </div>
        <span className="text-caption font-bold text-muted">
          {doneCount}/{today.tasks.length} · +{pointsToday} today
        </span>
      </div>
      {allDone ? (
        <p className="mt-1.5 text-caption font-semibold text-success">
          Full day ✓ — bonus earned. Gentle on yourself tomorrow too.
        </p>
      ) : null}

      {notice ? (
        <p className="mt-2 text-caption font-medium text-primary">
          <Link href="/login" className="underline">
            {notice}
          </Link>
        </p>
      ) : null}

      {/* The checklist */}
      <ul className="mt-3 space-y-1.5">
        {today.tasks.map((t) => {
          const done = isDone(t);
          return (
            <li key={t.key}>
              <button
                onClick={() => toggle(t)}
                aria-pressed={done}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors",
                  done
                    ? "border-primary/40 bg-light-purple"
                    : "border-line bg-page hover:border-primary/40",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    done ? "border-primary bg-primary text-white" : "border-line text-transparent",
                  )}
                >
                  ✓
                </span>
                <span
                  className={cn(
                    "flex-1 text-step font-medium",
                    done ? "text-primary" : "text-ink",
                  )}
                >
                  {t.label}
                </span>
                <span className="text-caption font-semibold text-muted">
                  +{today.points.perTask}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Month strip */}
      <div className="mt-4">
        <p className="mb-1.5 flex items-baseline text-caption font-bold text-muted">
          This month
          <span className="ml-auto font-semibold">
            {today.points.month + (pointsToday - today.points.today)} pts
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: dayOfMonth }, (_, i) => i + 1).map((d) => {
            const rec = d === dayOfMonth ? { completed: doneCount, total: today.tasks.length } : monthByDay.get(d);
            const frac = rec ? rec.completed / rec.total : 0;
            return (
              <span
                key={d}
                title={`Day ${d}: ${rec?.completed ?? 0}/${today.tasks.length}`}
                className={cn(
                  "h-3 w-3 rounded-full",
                  frac >= 1
                    ? "bg-primary"
                    : frac > 0
                      ? "bg-primary/40"
                      : "bg-light-blue",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* The circle — support each other */}
      {circle.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-caption font-bold text-muted">Your circle today</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {circle.map((entry) => (
              <div
                key={entry.user.id}
                className="flex w-24 shrink-0 flex-col items-center rounded-2xl bg-page p-2.5 text-center"
              >
                <Link href={`/user/${entry.user.id}`}>
                  <UserAvatar
                    name={entry.user.name}
                    src={entry.user.avatarUrl}
                    color={entry.user.avatarColor}
                    size={38}
                  />
                </Link>
                <p className="mt-1 w-full truncate text-caption font-semibold text-ink">
                  {entry.user.name.split(" ")[0]}
                </p>
                <p className="text-[10px] font-bold text-muted">
                  {entry.todayCompleted}/{entry.todayTotal} · {entry.monthPoints} pts
                </p>
                <button
                  onClick={() => cheer(entry)}
                  disabled={entry.cheeredToday}
                  className={cn(
                    "mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors",
                    entry.cheeredToday
                      ? "bg-light-green text-success"
                      : "bg-light-purple text-primary hover:bg-primary hover:text-white",
                  )}
                >
                  {entry.cheeredToday ? "Cheered ✓" : "Cheer 🎉"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
