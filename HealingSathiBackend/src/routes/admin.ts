import { NextFunction, Request, Response, Router } from "express";
import { Consultant, ConsultantApplication, Group, Notification, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString } from "../utils/validate";

/**
 * Superuser review queue (Moderation Phase A).
 *
 * Two things need a human "yes" before they go live to the community:
 *  - group proposals (RequestGroupScreen → Group with status "proposed")
 *  - consultant applications (BecomeConsultantScreen → ConsultantApplication "pending")
 *
 * Only users with role "admin" get in. Admin is granted manually (seed or DB edit) —
 * there is deliberately no API that can elevate a user, so a stolen member token can
 * never reach these routes.
 */
const router = Router();

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId, "role");
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};

router.use(requireAuth, requireAdmin);

// GET /api/admin/reviews — everything awaiting a decision, oldest first
router.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const [proposals, applications] = await Promise.all([
      Group.find({ status: "proposed" }).sort({ createdAt: 1 }).populate("proposal.proposedBy", "name email"),
      ConsultantApplication.find({ status: "pending" }).sort({ createdAt: 1 }).populate("user", "name email"),
    ]);

    res.json({
      groupProposals: proposals.map((g: any) => ({
        id: g._id.toString(),
        condition: g.proposal?.condition ?? g.name,
        description: g.description,
        population: g.proposal?.population ?? "",
        reason: g.proposal?.reason ?? "",
        references: g.proposal?.references ?? "",
        proposedBy: g.proposal?.proposedBy?.name ?? "Member",
        proposedByEmail: g.proposal?.proposedBy?.email ?? "",
        submittedAt: g.createdAt,
      })),
      consultantApplications: applications.map((a: any) => ({
        id: a._id.toString(),
        fullName: a.fullName,
        specialty: a.specialty,
        credentials: a.credentials,
        licenseNumber: a.licenseNumber,
        yearsExperience: a.yearsExperience,
        bio: a.bio,
        languages: a.languages ?? [],
        applicantEmail: a.user?.email ?? "",
        submittedAt: a.createdAt,
      })),
    });
  }),
);

// POST /api/admin/group-proposals/:id/approve { name?, tag? }
// The group goes live under its condition name (or an admin-supplied override) and
// the proposer becomes its first member.
router.post(
  "/group-proposals/:id/approve",
  asyncHandler(async (req, res) => {
    const group: any = await Group.findOne({ _id: req.params.id, status: "proposed" });
    if (!group) throw new HttpError(404, "Proposal not found (already reviewed?)");

    const name = cleanOptionalString(req.body?.name, "name", { max: 100 }) ?? group.proposal?.condition;
    const tag = cleanOptionalString(req.body?.tag, "tag", { max: 40 });
    if (!name) throw new HttpError(400, "The proposal has no condition name — pass one explicitly");

    group.name = name;
    if (tag) group.tag = tag;
    group.status = "active";
    const proposer = group.proposal?.proposedBy;
    if (proposer) group.members.addToSet(proposer);
    try {
      await group.save();
    } catch (err: any) {
      if (err?.code === 11000) throw new HttpError(409, `A group named "${name}" already exists`);
      throw err;
    }

    if (proposer) {
      await Notification.create({
        user: proposer,
        type: "Groups",
        title: "Your group is live 🎉",
        message: `"${name}" was approved — you're its first member. Invite your sathis!`,
      });
    }
    res.json({ ok: true, groupId: group._id.toString(), name });
  }),
);

// POST /api/admin/group-proposals/:id/reject { reason? }
router.post(
  "/group-proposals/:id/reject",
  asyncHandler(async (req, res) => {
    const reason = cleanOptionalString(req.body?.reason, "reason", { max: 500 });

    const group: any = await Group.findOneAndUpdate(
      { _id: req.params.id, status: "proposed" },
      { status: "rejected" },
      { new: true },
    );
    if (!group) throw new HttpError(404, "Proposal not found (already reviewed?)");

    if (group.proposal?.proposedBy) {
      await Notification.create({
        user: group.proposal.proposedBy,
        type: "Groups",
        title: "Group proposal update",
        message:
          reason ??
          `Your proposal for "${group.proposal?.condition ?? group.name}" wasn't approved this time. You're welcome to refine and resubmit it.`,
      });
    }
    res.json({ ok: true });
  }),
);

// POST /api/admin/consultant-applications/:id/approve
// Creates the public Consultant profile from the application.
router.post(
  "/consultant-applications/:id/approve",
  asyncHandler(async (req, res) => {
    const application: any = await ConsultantApplication.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "approved" },
      { new: true },
    );
    if (!application) throw new HttpError(404, "Application not found (already reviewed?)");

    const consultant = await Consultant.create({
      name: application.fullName,
      role: application.specialty,
      bio: application.bio,
      languages: application.languages ?? [],
      rating: 5,
      reviewCount: 0,
    });

    await Notification.create({
      user: application.user,
      type: "System",
      title: "You're approved as a consultant 🎉",
      message: `Welcome aboard, ${application.fullName}. Your profile is now listed under Psychological Help.`,
    });
    res.json({ ok: true, consultantId: consultant._id.toString() });
  }),
);

// POST /api/admin/consultant-applications/:id/reject { reason? }
// Rejected applicants may resubmit (the apply route allows it).
router.post(
  "/consultant-applications/:id/reject",
  asyncHandler(async (req, res) => {
    const reason = cleanOptionalString(req.body?.reason, "reason", { max: 500 });

    const application: any = await ConsultantApplication.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "rejected" },
      { new: true },
    );
    if (!application) throw new HttpError(404, "Application not found (already reviewed?)");

    await Notification.create({
      user: application.user,
      type: "System",
      title: "Consultant application update",
      message:
        reason ??
        "Your consultant application wasn't approved this time. You can update your details and apply again.",
    });
    res.json({ ok: true });
  }),
);

export default router;
