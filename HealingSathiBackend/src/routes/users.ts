import { Router } from "express";
import { HabitDay, Post, SathiRequest, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanString } from "../utils/validate";
import { shapePost } from "./posts";
import { badgeFor } from "../utils/healingLevels";
import { sumPoints } from "./habits";

/**
 * People directory: search users and manage the block list.
 * Blocking is enforced here (search) and at the contact points (chats, sathi requests).
 */
const router = Router();
router.use(requireAuth);

/** User ids invisible to me: people I blocked + people who blocked me. */
export const hiddenUserIds = async (userId: string): Promise<string[]> => {
  const me = await User.findById(userId, "blockedUsers");
  const blockedMe = await User.find({ blockedUsers: userId }, "_id");
  return [
    ...(me?.blockedUsers ?? []).map((id: any) => id.toString()),
    ...blockedMe.map((u: any) => u._id.toString()),
  ];
};

/** True when either side has blocked the other — used by chats and sathi requests. */
export const isBlockedEitherWay = async (userId: string, otherId: string): Promise<boolean> => {
  const count = await User.countDocuments({
    $or: [
      { _id: userId, blockedUsers: otherId },
      { _id: otherId, blockedUsers: userId },
    ],
  });
  return count > 0;
};

// GET /api/users/search?q= — find people by name or email (Search screen "People")
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = cleanString(req.query.q, "q", { max: 80 });
    // Escape regex metacharacters so "a+b" searches literally instead of erroring.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const hidden = await hiddenUserIds(req.userId!);
    const users = await User.find(
      {
        _id: { $nin: [req.userId, ...hidden] },
        $or: [{ name: { $regex: safe, $options: "i" } }, { email: safe.toLowerCase() }],
      },
      "name avatarColor conditions sathis",
    ).limit(20);

    // Relationship status drives the button state on each search result:
    // none → "+ Add Sathi", pending → "Requested", sathi → already connected.
    const pending = await SathiRequest.find(
      { from: req.userId, to: { $in: users.map((u) => u._id) }, status: "pending" },
      "to",
    );
    const pendingSet = new Set(pending.map((r: any) => r.to.toString()));

    res.json({
      users: users.map((u: any) => {
        const id = u._id.toString();
        return {
          id,
          name: u.name,
          avatarColor: u.avatarColor,
          conditions: u.conditions ?? [],
          relation: u.sathis.some((s: any) => s.toString() === req.userId)
            ? "sathi"
            : pendingSet.has(id)
              ? "pending"
              : "none",
        };
      }),
    });
  }),
);

// GET /api/users/:id/profile — someone's public, read-only profile:
// who they are, how long they've been here, their posts and the posts they've
// supported. Blocked-either-way answers 404 so blocking is never confirmable.
router.get(
  "/:id/profile",
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const user: any = await User.findById(
      targetId,
      "name avatarColor avatarUrl coverUrl conditions sathis createdAt",
    );
    if (!user) throw new HttpError(404, "User not found");
    if (targetId !== req.userId && (await isBlockedEitherWay(req.userId!, targetId))) {
      throw new HttpError(404, "User not found");
    }

    const pending = await SathiRequest.findOne({ from: req.userId, to: targetId, status: "pending" });
    const relation =
      targetId === req.userId
        ? "self"
        : user.sathis.some((s: any) => s.toString() === req.userId)
          ? "sathi"
          : pending
            ? "pending"
            : "none";

    const populate = [
      { path: "author", select: "name" },
      { path: "group", select: "name" },
    ];
    const [posts, likedPosts, habitRecords] = await Promise.all([
      Post.find({ author: targetId }).sort({ createdAt: -1 }).limit(20).populate(populate),
      Post.find({ supports: targetId }).sort({ createdAt: -1 }).limit(20).populate(populate),
      HabitDay.find({ user: targetId }, "completed"),
    ]);

    // Healing Points + badge — public by design: the circle chasing better
    // health together is the whole point of the gamification.
    const healingPoints = sumPoints(habitRecords as any);
    const { badge } = badgeFor(healingPoints);

    res.json({
      user: {
        id: targetId,
        name: user.name,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        conditions: user.conditions ?? [],
        memberSince: user.createdAt,
        sathiCount: user.sathis.length,
        relation,
        healingPoints,
        badge: { level: badge.level, name: badge.name, icon: badge.icon },
      },
      posts: posts.map((p) => shapePost(p, req.userId!)),
      likedPosts: likedPosts.map((p) => shapePost(p, req.userId!)),
    });
  }),
);

// GET /api/users/blocked — my block list (Settings → Blocked users)
router.get(
  "/blocked",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId).populate("blockedUsers", "name avatarColor");
    res.json({
      users: (me?.blockedUsers ?? []).map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        avatarColor: u.avatarColor,
      })),
    });
  }),
);

// POST /api/users/:id/block — also severs an existing sathi connection
router.post(
  "/:id/block",
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    if (targetId === req.userId) throw new HttpError(400, "You can't block yourself");
    if (!(await User.findById(targetId))) throw new HttpError(404, "User not found");

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { blockedUsers: targetId },
      $pull: { sathis: targetId },
    });
    await User.findByIdAndUpdate(targetId, { $pull: { sathis: req.userId } });
    await SathiRequest.deleteMany({
      $or: [
        { from: req.userId, to: targetId },
        { from: targetId, to: req.userId },
      ],
    });

    res.json({ ok: true });
  }),
);

// POST /api/users/:id/unblock
router.post(
  "/:id/unblock",
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.userId, { $pull: { blockedUsers: req.params.id } });
    res.json({ ok: true });
  }),
);

export default router;
