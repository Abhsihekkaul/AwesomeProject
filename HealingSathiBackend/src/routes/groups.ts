import { Router } from "express";
import { Group } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString, cleanString } from "../utils/validate";
import { GROUP_COVER_PRESETS, presetCoverFor } from "../data/groupCovers";

const router = Router();
router.use(requireAuth);

const shapeGroup = (g: any, userId: string) => ({
  id: g._id.toString(),
  name: g.name,
  description: g.description,
  tag: g.tag,
  moderator: g.moderator,
  memberCount: g.members.length,
  joined: g.members.some((id: any) => id.toString() === userId),
  // Every group always has a cover: the one a member set, else a healing
  // preset chosen deterministically by id — existing groups included.
  coverUrl: g.coverUrl ?? presetCoverFor(g._id.toString()).uri,
});

// GET /api/groups — active groups directory
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const groups = await Group.find({ status: "active" }).sort({ name: 1 });
    res.json({ groups: groups.map((g) => shapeGroup(g, req.userId!)) });
  }),
);

// GET /api/groups/:id/members — the group's member list (GroupDetails → Members tab)
router.get(
  "/:id/members",
  asyncHandler(async (req, res) => {
    const group = await Group.findOne({ _id: req.params.id, status: "active" }).populate(
      "members",
      "name",
    );
    if (!group) throw new HttpError(404, "Group not found");

    res.json({
      members: (group.members as any[]).map((m) => ({
        id: m._id.toString(),
        name: m.name,
        role: "Member",
      })),
    });
  }),
);

// POST /api/groups/:id/join — toggles membership
router.post(
  "/:id/join",
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found");

    const already = group.members.some((id: any) => id.toString() === req.userId);
    await group.updateOne(
      already ? { $pull: { members: req.userId } } : { $addToSet: { members: req.userId } },
    );
    res.json({ ok: true, joined: !already });
  }),
);

// PATCH /api/groups/:id/cover { coverUrl } — set the group's cover photo.
// Members only. Accepts a preset key ("lavender"), a data-URI photo (healing
// imagery encouraged — the pickers lead with the presets), or null to return
// to the group's deterministic preset.
router.patch(
  "/:id/cover",
  asyncHandler(async (req, res) => {
    const group = await Group.findOne({ _id: req.params.id, status: "active" });
    if (!group) throw new HttpError(404, "Group not found");
    const isMember = group.members.some((id: any) => id.toString() === req.userId);
    if (!isMember) throw new HttpError(403, "Join the group to change its cover");

    const raw = req.body?.coverUrl;
    let coverUrl: string | null;
    if (raw === null || raw === undefined || raw === "") {
      coverUrl = null;
    } else {
      const value = cleanString(raw, "coverUrl", { max: 8_000_000 });
      const preset = GROUP_COVER_PRESETS.find((p) => p.key === value);
      if (preset) coverUrl = preset.uri;
      else if (value.startsWith("data:image/")) coverUrl = value;
      else throw new HttpError(400, "coverUrl must be a preset key or an image data-URI");
    }

    group.coverUrl = coverUrl as any;
    await group.save();
    res.json({ coverUrl: coverUrl ?? presetCoverFor(group._id.toString()).uri });
  }),
);

// POST /api/groups/request { condition, description, population?, reason, references? }
// Creates a "proposed" group for medical-team review (RequestGroupScreen).
router.post(
  "/request",
  asyncHandler(async (req, res) => {
    const condition = cleanString(req.body?.condition, "condition", { max: 100 });
    const description = cleanString(req.body?.description, "description", { max: 1000 });
    const reason = cleanString(req.body?.reason, "reason", { max: 1000 });
    const population = cleanOptionalString(req.body?.population, "population", { max: 200 });
    const references = cleanOptionalString(req.body?.references, "references", { max: 1000 });

    const group = await Group.create({
      name: `${condition} (proposed ${Date.now()})`,
      description,
      status: "proposed",
      proposal: { condition, population, reason, references, proposedBy: req.userId },
    });
    res.status(201).json({ ok: true, proposalId: group._id.toString() });
  }),
);

export default router;
