import { Router } from "express";
import { Conversation, Notification, SathiRequest, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { isBlockedEitherWay } from "./users";

const router = Router();
router.use(requireAuth);

// GET /api/sathi — my accepted sathis (friends list)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId).populate("sathis", "name avatarColor");
    res.json({
      sathis: (me?.sathis ?? []).map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        avatarColor: s.avatarColor,
      })),
    });
  }),
);

// GET /api/sathi/requests — pending requests addressed to me (Notifications → Requests tab)
router.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const requests = await SathiRequest.find({ to: req.userId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("from", "name");

    res.json({
      requests: requests.map((r: any) => ({
        id: r._id.toString(),
        name: r.from?.name ?? "Member",
        fromUserId: r.from?._id?.toString(),
        time: r.createdAt,
      })),
    });
  }),
);

// POST /api/sathi/requests { toUserId } — send a request (Add Sathi buttons)
router.post(
  "/requests",
  asyncHandler(async (req, res) => {
    const { toUserId } = req.body ?? {};
    if (!toUserId) throw new HttpError(400, "toUserId is required");
    if (toUserId === req.userId) throw new HttpError(400, "You can't add yourself");
    if (!(await User.findById(toUserId))) throw new HttpError(404, "User not found");
    // 404 (not 403) so a blocked user can't confirm they were blocked.
    if (await isBlockedEitherWay(req.userId!, toUserId)) throw new HttpError(404, "User not found");

    // Explicit state machine: already friends → 409; already pending → idempotent ok
    // (no duplicate notification); previously declined → quietly reset to pending.
    const existing = await SathiRequest.findOne({ from: req.userId, to: toUserId });
    if (existing?.status === "accepted") throw new HttpError(409, "You are already sathis");
    if (existing?.status === "pending") {
      res.status(200).json({ ok: true, requestId: existing._id.toString() });
      return;
    }

    const request = existing
      ? await SathiRequest.findByIdAndUpdate(existing._id, { status: "pending" }, { new: true })
      : await SathiRequest.create({ from: req.userId, to: toUserId, status: "pending" });

    const sender = await User.findById(req.userId, "name");
    await Notification.create({
      user: toUserId,
      type: "Chats",
      title: "New Sathi request",
      message: `${sender?.name ?? "Someone"} wants to connect with you.`,
    });

    res.status(201).json({ ok: true, requestId: request!._id.toString() });
  }),
);

// POST /api/sathi/requests/:id/respond { action: "accept" | "decline" }
router.post(
  "/requests/:id/respond",
  asyncHandler(async (req, res) => {
    const request = await SathiRequest.findOne({ _id: req.params.id, to: req.userId, status: "pending" });
    if (!request) throw new HttpError(404, "Request not found");

    const accept = req.body?.action === "accept";
    request.status = accept ? "accepted" : "declined";
    await request.save();

    if (accept) {
      // Friendship is mutual — add each user to the other's sathis.
      await User.findByIdAndUpdate(request.from, { $addToSet: { sathis: request.to } });
      await User.findByIdAndUpdate(request.to, { $addToSet: { sathis: request.from } });

      // New sathis appear in each other's chat list immediately — the conversation
      // exists from the moment the friendship does, with a nudge to break the ice.
      const existing = await Conversation.findOne({
        participants: { $all: [request.from, request.to], $size: 2 },
      });
      if (!existing) {
        await Conversation.create({
          participants: [request.from, request.to],
          lastMessageText: "You're now sathis — say hi 👋",
        });
      }

      const accepter = await User.findById(req.userId, "name");
      await Notification.create({
        user: request.from,
        type: "Chats",
        title: "Sathi request accepted",
        message: `${accepter?.name ?? "Your new sathi"} accepted your request. Say hi!`,
      });
    }
    res.json({ ok: true, status: request.status });
  }),
);

export default router;
