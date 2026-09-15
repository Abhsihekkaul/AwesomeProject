import { Router } from "express";
import { Diya, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString, cleanString } from "../utils/validate";

/**
 * Diya — HealingSathi's daily check-in ritual (the healing answer to
 * stories/streaks). Lighting a diya = sharing how the moment actually is:
 * a mood, an optional thought and/or photo. Up to 20 a day (stories-style),
 * each visible to your sathis for 24 hours from lighting.
 *
 * DELIBERATELY GENTLE (2026 wellness-design guidance: streak pressure harms
 * distressed users): the flame ticks once per lit day; a missed day quietly
 * restarts it at 1 on the next check-in. No warnings or nags — ever.
 */

const router = Router();
router.use(requireAuth);

const MAX_PER_DAY = 20;
const LIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** UTC day key, e.g. "2026-07-18" — drives the daily cap + streak tick. */
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const yesterdayKey = () => dayKey(new Date(Date.now() - LIVE_WINDOW_MS));
const liveSince = () => new Date(Date.now() - LIVE_WINDOW_MS);

const shapeDiya = (d: any, viewerId: string) => ({
  id: d._id.toString(),
  mood: d.mood,
  note: d.note ?? "",
  photo: d.photo ?? null,
  time: d.createdAt,
  supportCount: (d.supports ?? []).length,
  supported: (d.supports ?? []).some((s: any) => s.toString() === viewerId),
});

// POST /api/diyas { mood, note?, photo? } — light a new diya (up to 20/day).
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const mood = cleanString(req.body?.mood, "mood", { max: 40 });
    const note = cleanOptionalString(req.body?.note, "note", { max: 500 }) ?? "";
    const photo = cleanOptionalString(req.body?.photo, "photo", { max: 8_000_000 }) ?? null;

    const today = dayKey();
    const litToday = await Diya.countDocuments({ user: req.userId, day: today });
    if (litToday >= MAX_PER_DAY) {
      throw new HttpError(400, `That's ${MAX_PER_DAY} diyas today — plenty of light. Tomorrow brings more.`);
    }

    const diya = await Diya.create({ user: req.userId, day: today, mood, note, photo });

    const me: any = await User.findById(req.userId, "diyaStreak lastDiyaDay");
    if (!me) throw new HttpError(404, "User not found");
    if (me.lastDiyaDay !== today) {
      me.diyaStreak = me.lastDiyaDay === yesterdayKey() ? (me.diyaStreak ?? 0) + 1 : 1;
      me.lastDiyaDay = today;
      await me.save();
    }

    res.status(201).json({ diya: shapeDiya(diya, req.userId!), streak: me.diyaStreak });
  }),
);

// GET /api/diyas — my live diyas + every sathi's live (last-24h) diyas.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const me: any = await User.findById(req.userId, "diyaStreak lastDiyaDay sathis").populate(
      "sathis",
      "name avatarColor avatarUrl diyaStreak",
    );
    if (!me) throw new HttpError(404, "User not found");

    const sathiIds = (me.sathis ?? []).map((s: any) => s._id);
    const [mine, circleDiyas] = await Promise.all([
      Diya.find({ user: req.userId, createdAt: { $gte: liveSince() } }).sort({ createdAt: 1 }),
      Diya.find({ user: { $in: sathiIds }, createdAt: { $gte: liveSince() } }).sort({ createdAt: 1 }),
    ]);

    const byUser = new Map<string, any[]>();
    for (const d of circleDiyas) {
      const key = d.user.toString();
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(d);
    }

    const circle = (me.sathis ?? [])
      .filter((s: any) => byUser.has(s._id.toString()))
      .map((s: any) => ({
        user: {
          id: s._id.toString(),
          name: s.name,
          avatarColor: s.avatarColor,
          avatarUrl: s.avatarUrl ?? null,
        },
        streak: s.diyaStreak ?? 0,
        diyas: byUser.get(s._id.toString())!.map((d) => shapeDiya(d, req.userId!)),
      }));

    res.json({
      mine: {
        litToday: mine.some((d: any) => d.day === dayKey()),
        // The flame only shows while alive (lit today or yesterday).
        streak: me.lastDiyaDay === dayKey() || me.lastDiyaDay === yesterdayKey() ? (me.diyaStreak ?? 0) : 0,
        diyas: mine.map((d: any) => shapeDiya(d, req.userId!)),
      },
      circle,
    });
  }),
);

// POST /api/diyas/:id/support — toggle "holding you" on a sathi's diya.
router.post(
  "/:id/support",
  asyncHandler(async (req, res) => {
    const diya: any = await Diya.findById(req.params.id);
    if (!diya) throw new HttpError(404, "Diya not found");

    const owner: any = await User.findById(diya.user, "sathis");
    const isMine = diya.user.toString() === req.userId;
    const isSathi = (owner?.sathis ?? []).some((s: any) => s.toString() === req.userId);
    if (!isMine && !isSathi) throw new HttpError(404, "Diya not found");

    const already = diya.supports.some((s: any) => s.toString() === req.userId);
    if (already) diya.supports = diya.supports.filter((s: any) => s.toString() !== req.userId);
    else diya.supports.push(req.userId);
    await diya.save();

    res.json({ supported: !already, supportCount: diya.supports.length });
  }),
);

export default router;
