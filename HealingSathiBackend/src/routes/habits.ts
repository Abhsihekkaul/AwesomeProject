import { Router } from "express";
import { HabitCheer, HabitDay, Notification, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanString } from "../utils/validate";
import { badgeFor, HEALING_LEVELS } from "../utils/healingLevels";

/**
 * Healing Habits — the gamification layer (see MainWebsite.md → HABITS).
 * A daily checklist everyone shares for now (disease-specific lists are the
 * planned next step — the list already lives server-side so that change
 * won't touch the clients). Sathis see each other's daily progress and can
 * cheer once a day; cheers arrive as real notifications.
 *
 * Healing Points are always DERIVED from HabitDay records — 10 per ticked
 * task, +20 for a full day — never stored, so they can't drift or be lost.
 *
 * DELIBERATELY GENTLE (same philosophy as the diya): no streak-loss warnings,
 * no red "you failed" states, no public leaderboard — your circle sees today's
 * progress, not your gaps.
 */

const router = Router();
router.use(requireAuth);

// The shared daily checklist. Server-owned so per-condition lists later are a
// backend-only change.
const DEFAULT_TASKS = [
  { key: "water", label: "Drink 2–4 litres of water" },
  { key: "sleep", label: "Sleep 7–8 hours" },
  { key: "walk", label: "Take a 30-minute walk" },
  { key: "breathe", label: "60 seconds of slow breathing" },
  { key: "veg", label: "Eat one extra fruit or vegetable" },
];
const TASK_KEYS = new Set(DEFAULT_TASKS.map((t) => t.key));

const POINTS_PER_TASK = 1;
const FULL_DAY_BONUS = 10; // a perfect day = 5 + 10 = 15 points

/** UTC day key "YYYY-MM-DD" — same convention as diyas. */
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const monthPrefix = () => dayKey().slice(0, 7); // "YYYY-MM"

const dayPoints = (completedCount: number) =>
  completedCount * POINTS_PER_TASK + (completedCount >= DEFAULT_TASKS.length ? FULL_DAY_BONUS : 0);

/** Sum points over a set of HabitDay records (also used by profile routes). */
export const sumPoints = (records: { completed: string[] }[]) =>
  records.reduce((total, r) => total + dayPoints(r.completed.length), 0);

// GET /api/habits/today — my checklist + points + this month's progress strip.
router.get(
  "/today",
  asyncHandler(async (req, res) => {
    const today = dayKey();
    const [todayRecord, monthRecords, allRecords] = await Promise.all([
      HabitDay.findOne({ user: req.userId, day: today }),
      HabitDay.find({ user: req.userId, day: { $regex: `^${monthPrefix()}` } }),
      HabitDay.find({ user: req.userId }, "completed"),
    ]);

    const done = new Set((todayRecord?.completed ?? []) as string[]);
    const total = sumPoints(allRecords as any);
    const { badge, nextBadge } = badgeFor(total);
    res.json({
      day: today,
      tasks: DEFAULT_TASKS.map((t) => ({ ...t, done: done.has(t.key) })),
      points: {
        today: dayPoints(done.size),
        month: sumPoints(monthRecords as any),
        total,
        perTask: POINTS_PER_TASK,
        fullDayBonus: FULL_DAY_BONUS,
      },
      badge: { level: badge.level, name: badge.name, icon: badge.icon, min: badge.min },
      nextBadge,
      // The whole ladder — every profile shows the missions ahead, not just
      // the rung you're on.
      levels: HEALING_LEVELS,
      // The month strip: one entry per day that has any ticks (clients render
      // the empty days themselves — absence of a day means 0, not failure).
      month: (monthRecords as any[]).map((r) => ({
        day: r.day,
        completed: r.completed.length,
        total: DEFAULT_TASKS.length,
      })),
    });
  }),
);

// POST /api/habits/toggle { taskKey } — tick/untick one of today's tasks.
router.post(
  "/toggle",
  asyncHandler(async (req, res) => {
    const taskKey = cleanString(req.body?.taskKey, "taskKey", { max: 40 });
    if (!TASK_KEYS.has(taskKey)) throw new HttpError(400, "Unknown task");

    const today = dayKey();
    const record: any =
      (await HabitDay.findOne({ user: req.userId, day: today })) ??
      new HabitDay({ user: req.userId, day: today, completed: [] });

    const already = record.completed.includes(taskKey);
    record.completed = already
      ? record.completed.filter((k: string) => k !== taskKey)
      : [...record.completed, taskKey];
    await record.save();

    res.json({
      done: !already,
      completed: record.completed,
      pointsToday: dayPoints(record.completed.length),
    });
  }),
);

// GET /api/habits/circle — each sathi's progress today (+ month points), so
// the circle can support each other.
router.get(
  "/circle",
  asyncHandler(async (req, res) => {
    const me: any = await User.findById(req.userId, "sathis").populate(
      "sathis",
      "name avatarColor avatarUrl",
    );
    if (!me) throw new HttpError(404, "User not found");

    const sathiIds = (me.sathis ?? []).map((s: any) => s._id);
    const today = dayKey();
    const [todayRecords, monthRecords, myCheers] = await Promise.all([
      HabitDay.find({ user: { $in: sathiIds }, day: today }),
      HabitDay.find({ user: { $in: sathiIds }, day: { $regex: `^${monthPrefix()}` } }),
      HabitCheer.find({ from: req.userId, day: today }),
    ]);

    const todayByUser = new Map(todayRecords.map((r: any) => [r.user.toString(), r]));
    const monthByUser = new Map<string, any[]>();
    for (const r of monthRecords as any[]) {
      const key = r.user.toString();
      if (!monthByUser.has(key)) monthByUser.set(key, []);
      monthByUser.get(key)!.push(r);
    }
    const cheered = new Set(myCheers.map((c: any) => c.to.toString()));

    res.json({
      circle: (me.sathis ?? []).map((s: any) => {
        const id = s._id.toString();
        return {
          user: {
            id,
            name: s.name,
            avatarColor: s.avatarColor,
            avatarUrl: s.avatarUrl ?? null,
          },
          todayCompleted: (todayByUser.get(id) as any)?.completed.length ?? 0,
          todayTotal: DEFAULT_TASKS.length,
          monthPoints: sumPoints((monthByUser.get(id) ?? []) as any),
          cheeredToday: cheered.has(id),
        };
      }),
    });
  }),
);

// POST /api/habits/:userId/cheer — support a sathi's progress (once a day);
// arrives as a real notification on their side.
router.post(
  "/:userId/cheer",
  asyncHandler(async (req, res) => {
    const targetId = req.params.userId;
    const me: any = await User.findById(req.userId, "name sathis");
    if (!me) throw new HttpError(404, "User not found");
    const isSathi = (me.sathis ?? []).some((s: any) => s.toString() === targetId);
    if (!isSathi) throw new HttpError(404, "User not found");

    const today = dayKey();
    const existing = await HabitCheer.findOne({ from: req.userId, to: targetId, day: today });
    if (existing) {
      res.json({ cheered: true, already: true });
      return;
    }

    await HabitCheer.create({ from: req.userId, to: targetId, day: today });
    await Notification.create({
      user: targetId,
      type: "System",
      title: `${me.name} is cheering you on 🎉`,
      message: "They saw your healing habits today. Your circle is with you.",
    });

    res.json({ cheered: true, already: false });
  }),
);

export default router;
