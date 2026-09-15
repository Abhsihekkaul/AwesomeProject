import { Router } from "express";
import { Booking, Consultant, ConsultantApplication, HealthTip, Notification, TipComment } from "../models";
import { TIPS_SEED } from "../data/tipsSeed";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString, cleanString, cleanStringArray } from "../utils/validate";

/**
 * Smaller resources grouped in one router: notifications, consultants + bookings, health tips.
 * Split into their own files when any of them grows past ~3 endpoints.
 */
const router = Router();
router.use(requireAuth);

// ---------- Notifications ----------

// GET /api/notifications
router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        time: n.createdAt,
        unread: !n.read,
        // Message notifications carry their conversation so the app can open it.
        chatId: n.chatId ?? null,
      })),
    });
  }),
);

// POST /api/notifications/read-all
router.post(
  "/notifications/read-all",
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    res.json({ ok: true });
  }),
);

// ---------- Consultants & bookings ----------

// GET /api/consultants
router.get(
  "/consultants",
  asyncHandler(async (_req, res) => {
    const consultants = await Consultant.find().sort({ rating: -1 });
    res.json({
      consultants: consultants.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        role: c.role,
        bio: c.bio,
        rating: c.rating,
        reviewCount: c.reviewCount,
        tags: c.tags,
        languages: c.languages,
        feeRange: c.feeRange,
      })),
    });
  }),
);

// POST /api/bookings { consultantId, sessionType, date, time, note? }
router.post(
  "/bookings",
  asyncHandler(async (req, res) => {
    const { consultantId, sessionType } = req.body ?? {};
    if (!consultantId) throw new HttpError(400, "consultantId, date and time are required");
    const date = cleanString(req.body?.date, "date", { max: 60 });
    const time = cleanString(req.body?.time, "time", { max: 60 });
    const note = cleanOptionalString(req.body?.note, "note", { max: 500 });
    if (!(await Consultant.findById(consultantId))) throw new HttpError(404, "Consultant not found");

    const booking = await Booking.create({
      user: req.userId,
      consultant: consultantId,
      sessionType: sessionType ?? "Video",
      date,
      time,
      note: note ?? "",
    });

    await Notification.create({
      user: req.userId,
      type: "System",
      title: "Booking confirmed",
      message: `Your ${booking.sessionType.toLowerCase()} session is set for ${date} at ${time}.`,
    });

    res.status(201).json({ bookingId: booking._id.toString(), status: booking.status });
  }),
);

// GET /api/bookings — my bookings
router.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("consultant", "name role");

    res.json({
      bookings: bookings.map((b: any) => ({
        id: b._id.toString(),
        consultant: b.consultant?.name,
        role: b.consultant?.role,
        sessionType: b.sessionType,
        date: b.date,
        time: b.time,
        status: b.status,
      })),
    });
  }),
);

// ---------- Consultant applications ("Join as a consultant") ----------

const shapeApplication = (a: any) => ({
  id: a._id.toString(),
  fullName: a.fullName,
  specialty: a.specialty,
  credentials: a.credentials,
  licenseNumber: a.licenseNumber,
  yearsExperience: a.yearsExperience,
  bio: a.bio,
  languages: a.languages ?? [],
  status: a.status,
  submittedAt: a.createdAt,
});

// POST /api/consultants/apply { fullName, specialty, credentials, licenseNumber?, yearsExperience?, bio?, languages? }
// One application per user. A rejected application may be resubmitted (back to pending);
// pending/approved ones can't be duplicated.
router.post(
  "/consultants/apply",
  asyncHandler(async (req, res) => {
    const fullName = cleanString(req.body?.fullName, "fullName", { max: 80 });
    const specialty = cleanString(req.body?.specialty, "specialty", { max: 100 });
    const credentials = cleanString(req.body?.credentials, "credentials", { max: 300 });
    const licenseNumber = cleanOptionalString(req.body?.licenseNumber, "licenseNumber", { max: 60 });
    const bio = cleanOptionalString(req.body?.bio, "bio", { max: 1000 });
    const languages = cleanStringArray(req.body?.languages, "languages", { maxItems: 10, maxLength: 40 });
    const yearsExperience = Math.max(0, Math.min(60, Number(req.body?.yearsExperience) || 0));

    const existing = await ConsultantApplication.findOne({ user: req.userId });
    if (existing && existing.status !== "rejected") {
      throw new HttpError(409, `You already have a ${existing.status} application`);
    }

    const fields = {
      fullName, specialty, credentials,
      licenseNumber: licenseNumber ?? "",
      bio: bio ?? "",
      languages: languages ?? [],
      yearsExperience,
      status: "pending" as const,
    };
    const application = existing
      ? await ConsultantApplication.findByIdAndUpdate(existing._id, fields, { new: true })
      : await ConsultantApplication.create({ user: req.userId, ...fields });

    await Notification.create({
      user: req.userId,
      type: "System",
      title: "Application received",
      message: "Our medical team will review your consultant application within 3–5 days.",
    });

    res.status(201).json({ application: shapeApplication(application) });
  }),
);

// GET /api/consultants/apply — my application (or { application: null })
router.get(
  "/consultants/apply",
  asyncHandler(async (req, res) => {
    const application = await ConsultantApplication.findOne({ user: req.userId });
    res.json({ application: application ? shapeApplication(application) : null });
  }),
);

// ---------- Health tips ----------

const shapeTip = (t: any, withContent = false) => ({
  id: t._id.toString(),
  type: t.type,
  title: t.title,
  summary: t.summary,
  author: t.authorName,
  condition: t.condition,
  duration: t.duration,
  ...(withContent ? { content: t.content ?? [] } : {}),
});

// The launch library seeds itself the first time the collection is empty —
// and once, dev-migration style, if the collection predates article content
// (content-less tips can have no comments yet, so replacing them is safe).
const ensureTipsSeeded = async () => {
  const hasContent = await HealthTip.exists({ "content.0": { $exists: true } });
  if (!hasContent) {
    await HealthTip.deleteMany({});
    await HealthTip.insertMany(TIPS_SEED as any);
  }
};

// GET /api/tips?condition=
router.get(
  "/tips",
  asyncHandler(async (req, res) => {
    await ensureTipsSeeded();
    const filter = req.query.condition ? { condition: req.query.condition } : {};
    const tips = await HealthTip.find(filter).sort({ createdAt: -1 }).limit(50);

    res.json({ tips: tips.map((t: any) => shapeTip(t)) });
  }),
);

// GET /api/tips/:id — one tip WITH its full article content.
router.get(
  "/tips/:id",
  asyncHandler(async (req, res) => {
    const tip = await HealthTip.findById(req.params.id);
    if (!tip) throw new HttpError(404, "Tip not found");
    res.json({ tip: shapeTip(tip, true) });
  }),
);

const shapeTipComment = (c: any, viewerId: string) => ({
  id: c._id.toString(),
  author: c.user?.name ?? "Member",
  authorId: c.user?._id?.toString() ?? "",
  avatarColor: c.user?.avatarColor,
  avatarUrl: c.user?.avatarUrl ?? null,
  text: c.text,
  time: c.createdAt,
  mine: (c.user?._id?.toString() ?? "") === viewerId,
});

// GET /api/tips/:id/comments — questions & experiences under a tip.
router.get(
  "/tips/:id/comments",
  asyncHandler(async (req, res) => {
    const comments = await TipComment.find({ tip: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate("user", "name avatarColor avatarUrl");
    res.json({ comments: comments.map((c: any) => shapeTipComment(c, req.userId!)) });
  }),
);

// POST /api/tips/:id/comments { text }
router.post(
  "/tips/:id/comments",
  asyncHandler(async (req, res) => {
    const text = cleanString(req.body?.text, "text", { max: 2000 });
    const tip = await HealthTip.findById(req.params.id);
    if (!tip) throw new HttpError(404, "Tip not found");

    const comment = await TipComment.create({ tip: tip._id, user: req.userId, text });
    await comment.populate("user", "name avatarColor avatarUrl");
    res.status(201).json({ comment: shapeTipComment(comment, req.userId!) });
  }),
);

// DELETE /api/tips/comments/:id — own comments only.
router.delete(
  "/tips/comments/:id",
  asyncHandler(async (req, res) => {
    const comment = await TipComment.findById(req.params.id);
    if (!comment) throw new HttpError(404, "Comment not found");
    if (comment.user.toString() !== req.userId) throw new HttpError(403, "Not your comment");
    await comment.deleteOne();
    res.json({ ok: true });
  }),
);

export default router;
