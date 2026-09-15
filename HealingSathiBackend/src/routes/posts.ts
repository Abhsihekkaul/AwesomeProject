import { Router } from "express";
import { Group, Post, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString, cleanString, cleanStringArray } from "../utils/validate";

const router = Router();
router.use(requireAuth);

/** Shapes a post for the app's PostCard component. (Also used by the public profile.) */
export const shapePost = (p: any, userId: string) => {
  // Older records have only `image`; newer ones carry the full carousel.
  const images: string[] = p.images?.length ? p.images : p.image ? [p.image] : [];
  return {
  id: p._id.toString(),
  author: p.author?.name ?? "Member",
  authorId: p.author?._id?.toString(),
  // Personal-feed posts have no group — circle stays empty so the app shows just
  // the author + time (only real groups get the "in {group}" treatment).
  circle: p.group?.name ?? "",
  time: p.createdAt,
  title: p.title,
  content: p.content,
  image: images[0] ?? null,
  images,
  supportCount: p.supports.length,
  helpfulCount: p.helpfuls.length,
  commentCount: p.comments.length,
  supportedByMe: p.supports.some((id: any) => id.toString() === userId),
  helpfulByMe: p.helpfuls.some((id: any) => id.toString() === userId),
  };
};

// GET /api/posts?groupId=&mine=1 — feed, newest first.
// The default feed works like any social platform's: your own posts, your sathis'
// posts, posts in groups you've joined — PLUS condition-based discovery, so a new
// account with conditions set immediately sees its community:
//  - posts in groups whose name/tag matches one of your conditions (joined or not)
//  - personal-feed posts by people who share a condition with you
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.groupId) filter.group = req.query.groupId;
    if (req.query.mine) filter.author = req.userId;

    if (!req.query.groupId && !req.query.mine) {
      const me = await User.findById(req.userId, "sathis conditions blockedUsers");
      const myGroups = await Group.find({ members: req.userId }, "_id");

      const conditions: string[] = (me?.conditions ?? []).filter(Boolean);
      const conditionRegexes = conditions.map(
        (c) => new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
      const [conditionGroups, conditionPeers] = conditions.length
        ? await Promise.all([
            Group.find(
              {
                status: "active",
                $or: [{ name: { $in: conditionRegexes } }, { tag: { $in: conditionRegexes } }],
              },
              "_id",
            ),
            User.find(
              {
                _id: { $nin: [req.userId, ...(me?.blockedUsers ?? [])] },
                conditions: { $in: conditions },
              },
              "_id",
            ),
          ])
        : [[], []];

      filter.$or = [
        { author: { $in: [req.userId, ...(me?.sathis ?? [])] } },
        { group: { $in: [...myGroups, ...conditionGroups].map((g) => g._id) } },
        // Same-condition peers surface only through their public (personal-feed)
        // posts — their group posts arrive via the matching groups above.
        { author: { $in: conditionPeers.map((u) => u._id) }, group: null },
      ];
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name")
      .populate("group", "name");

    res.json({ posts: posts.map((p) => shapePost(p, req.userId!)) });
  }),
);

// POST /api/posts { title, content, tags?, contentWarning?, image?, toFeed?, groupIds?, groupId? }
// Multi-destination: one post is created per target — the personal feed (`toFeed`)
// and/or any groups the author is a member of (`groupIds`). `groupId` is the legacy
// single-group form. No destination given = personal feed.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const content = cleanString(req.body?.content, "content", { max: 5000 });
    const title = cleanOptionalString(req.body?.title, "title", { max: 200 });
    const tags = cleanStringArray(req.body?.tags, "tags", { maxItems: 10, maxLength: 40 });
    const { groupId, contentWarning, toFeed } = req.body ?? {};

    // Photos: up to 10 per post (`images`), each a base64 data-URI (cloud media
    // storage is the roadmap item). The legacy single `image` field still works.
    if (Array.isArray(req.body?.images) && req.body.images.length > 10) {
      throw new HttpError(400, "You can share at most 10 photos in one post");
    }
    const imagesInput = cleanStringArray(req.body?.images, "images", {
      maxItems: 10,
      maxLength: 8_000_000,
    });
    const legacyImage = cleanOptionalString(req.body?.image, "image", { max: 8_000_000 });
    const images = imagesInput ?? (legacyImage ? [legacyImage] : []);

    const groupIds: string[] = Array.isArray(req.body?.groupIds)
      ? req.body.groupIds.map(String)
      : groupId
        ? [String(groupId)]
        : [];
    if (groupIds.length > 10) throw new HttpError(400, "A post can go to at most 10 groups");

    // Only members may post into a group.
    const memberGroups = groupIds.length
      ? await Group.find({ _id: { $in: groupIds }, members: req.userId }, "_id")
      : [];
    if (memberGroups.length !== new Set(groupIds).size) {
      throw new HttpError(403, "You can only post to groups you've joined");
    }

    const destinations: (string | null)[] = [
      ...(toFeed || groupIds.length === 0 ? [null] : []),
      ...groupIds,
    ];

    const fields = {
      author: req.userId,
      title: title ?? "",
      content,
      image: images[0] ?? null,
      images,
      tags: tags ?? [],
      contentWarning: !!contentWarning,
    };
    const created = await Promise.all(
      destinations.map(async (group) => {
        const post = await Post.create({ ...fields, group });
        return post.populate([{ path: "author", select: "name" }, { path: "group", select: "name" }]);
      }),
    );

    const shaped = created.map((p) => shapePost(p, req.userId!));
    // `post` (first destination) kept for existing callers; `posts` has every copy.
    res.status(201).json({ post: shaped[0], posts: shaped });
  }),
);

// GET /api/posts/saved — the user's saved posts (Profile → Saved tab)
router.get(
  "/saved",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).populate({
      path: "savedPosts",
      populate: [{ path: "author", select: "name" }, { path: "group", select: "name" }],
    });
    res.json({ posts: (user?.savedPosts ?? []).map((p: any) => shapePost(p, req.userId!)) });
  }),
);

// GET /api/posts/commented — posts the user has commented on (Profile → Commented tab)
router.get(
  "/commented",
  asyncHandler(async (req, res) => {
    const posts = await Post.find({ "comments.author": req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name")
      .populate("group", "name");
    res.json({ posts: posts.map((p: any) => shapePost(p, req.userId!)) });
  }),
);

// GET /api/posts/:id — single post with full comment thread
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
      .populate("author", "name")
      .populate("group", "name")
      .populate("comments.author", "name");
    if (!post) throw new HttpError(404, "Post not found");

    res.json({
      post: shapePost(post, req.userId!),
      comments: post.comments.map((c: any) => ({
        id: c._id.toString(),
        user: c.author?.name ?? "Member",
        authorId: c.author?._id?.toString(),
        text: c.text,
        parentId: c.parentId,
        time: c.createdAt,
        supportCount: c.supports?.length ?? 0,
        supportedByMe: (c.supports ?? []).some((id: any) => id.toString() === req.userId),
      })),
    });
  }),
);

// PATCH /api/posts/:id { title?, content?, contentWarning? } — author-only edit.
// Filtering by author means someone else's post answers 404 (not 403), so post ids
// can't be probed for ownership. Destination/photos aren't editable — repost instead.
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const content = cleanOptionalString(req.body?.content, "content", { max: 5000 });
    const title = cleanOptionalString(req.body?.title, "title", { max: 200 });
    const clearTitle = req.body?.title === ""; // explicit empty string removes the title

    const post: any = await Post.findOne({ _id: req.params.id, author: req.userId })
      .populate("author", "name")
      .populate("group", "name");
    if (!post) throw new HttpError(404, "Post not found");

    if (content) post.content = content;
    if (title) post.title = title;
    if (clearTitle) post.title = "";
    if (typeof req.body?.contentWarning === "boolean") post.contentWarning = req.body.contentWarning;
    await post.save();

    res.json({ post: shapePost(post, req.userId!) });
  }),
);

// DELETE /api/posts/:id — author-only; also drops the post from everyone's saved list.
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, author: req.userId });
    if (!post) throw new HttpError(404, "Post not found");

    await post.deleteOne();
    await User.updateMany({}, { $pull: { savedPosts: post._id } });
    res.json({ ok: true });
  }),
);

// DELETE /api/posts/:id/comments/:commentId — the comment's author OR the post's
// author (moderating their own post) may delete. The whole branch goes: replies to
// a deleted comment (and their replies) are removed too, so no orphans surface.
router.delete(
  "/:id/comments/:commentId",
  asyncHandler(async (req, res) => {
    const post: any = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, "Post not found");

    const comment = post.comments.find((c: any) => c._id.toString() === req.params.commentId);
    if (!comment) throw new HttpError(404, "Comment not found");

    const isCommentAuthor = comment.author.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;
    if (!isCommentAuthor && !isPostAuthor) {
      throw new HttpError(403, "You can only delete your own comments");
    }

    // Collect the comment + every descendant (flat storage: children point at
    // their parent via parentId).
    const doomed = new Set<string>([comment._id.toString()]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of post.comments) {
        if (c.parentId && doomed.has(String(c.parentId)) && !doomed.has(c._id.toString())) {
          doomed.add(c._id.toString());
          grew = true;
        }
      }
    }

    post.comments = post.comments.filter((c: any) => !doomed.has(c._id.toString()));
    await post.save();
    res.json({ ok: true, commentCount: post.comments.length });
  }),
);

// POST /api/posts/:id/comments { text, parentId? } — parentId threads the comment
// under an existing one. Returns the created comment so the client can render the
// real id/timestamp instead of its optimistic placeholder.
router.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const text = cleanString(req.body?.text, "text", { max: 1000 });
    const parentId = cleanOptionalString(req.body?.parentId, "parentId", { max: 40 });

    const post = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, "Post not found");
    if (parentId && !post.comments.some((c: any) => c._id.toString() === parentId)) {
      throw new HttpError(404, "The comment you're replying to no longer exists");
    }

    post.comments.push({ author: req.userId, text, parentId: parentId ?? null } as any);
    await post.save();
    const created: any = post.comments[post.comments.length - 1];

    res.status(201).json({
      ok: true,
      commentCount: post.comments.length,
      comment: {
        id: created._id.toString(),
        text: created.text,
        parentId: created.parentId,
        time: created.createdAt,
      },
    });
  }),
);

// POST /api/posts/:id/react { type: "support" | "helpful" } — toggles.
// Concurrency-safe: try to remove the reaction first ($pull matches only if it's
// there); nothing removed means it wasn't set, so $addToSet it. Two devices tapping
// at once can never double-count. The response carries the authoritative counts so
// every client reconciles its optimistic UI immediately.
router.post(
  "/:id/react",
  asyncHandler(async (req, res) => {
    const field = req.body?.type === "helpful" ? "helpfuls" : "supports";

    const pulled = await Post.updateOne(
      { _id: req.params.id, [field]: req.userId },
      { $pull: { [field]: req.userId } },
    );
    let active = false;
    if (pulled.modifiedCount === 0) {
      const added = await Post.updateOne(
        { _id: req.params.id },
        { $addToSet: { [field]: req.userId } },
      );
      if (added.matchedCount === 0) throw new HttpError(404, "Post not found");
      active = true;
    }

    const post: any = await Post.findById(req.params.id, "supports helpfuls comments");
    res.json({
      ok: true,
      active,
      supportCount: post?.supports.length ?? 0,
      helpfulCount: post?.helpfuls.length ?? 0,
      commentCount: post?.comments.length ?? 0,
    });
  }),
);

// POST /api/posts/:id/comments/:commentId/support — toggles a ♥ on a single comment.
// Same pull-then-add pattern as post reactions: atomic either way.
router.post(
  "/:id/comments/:commentId/support",
  asyncHandler(async (req, res) => {
    const { id, commentId } = req.params;

    const pulled = await Post.updateOne(
      { _id: id, comments: { $elemMatch: { _id: commentId, supports: req.userId } } },
      { $pull: { "comments.$.supports": req.userId } },
    );
    let active = false;
    if (pulled.modifiedCount === 0) {
      const added = await Post.updateOne(
        { _id: id, "comments._id": commentId },
        { $addToSet: { "comments.$.supports": req.userId } },
      );
      if (added.matchedCount === 0) throw new HttpError(404, "Comment not found");
      active = true;
    }

    const post: any = await Post.findOne({ _id: id, "comments._id": commentId }, { "comments.$": 1 });
    res.json({ ok: true, active, supportCount: post?.comments?.[0]?.supports.length ?? 0 });
  }),
);

// POST /api/posts/:id/save — toggles saved state (Profile → Saved tab)
router.post(
  "/:id/save",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, "User not found");

    const already = user.savedPosts.some((id: any) => id.toString() === req.params.id);
    await user.updateOne(
      already ? { $pull: { savedPosts: req.params.id } } : { $addToSet: { savedPosts: req.params.id } },
    );
    res.json({ ok: true, saved: !already });
  }),
);

export default router;
