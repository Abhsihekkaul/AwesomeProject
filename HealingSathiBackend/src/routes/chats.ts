import { Router } from "express";
import { Conversation, Diya, Message, Notification, Post, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanOptionalString } from "../utils/validate";
import { isBlockedEitherWay } from "./users";
import { shapePost } from "./posts";
import { emitToChat, emitToUser } from "../realtime";

/** Populate spec for a message's shared post (what shapePost needs). */
const SHARED_POST_POPULATE = {
  path: "sharedPost",
  populate: [
    { path: "author", select: "name" },
    { path: "group", select: "name" },
  ],
};

const router = Router();
router.use(requireAuth);

/**
 * Loads a conversation only if the caller is a participant. 404 (not 403) on
 * foreign conversations so valid ids can't be enumerated by outsiders.
 */
const findMyConversation = async (conversationId: string, userId: string) => {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  return conversation;
};

// GET /api/chats — my conversations, most recent first
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ participants: req.userId })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name");

    res.json({
      chats: conversations.map((c: any) => {
        const other = c.participants.find((p: any) => p._id.toString() !== req.userId);
        return {
          id: c._id.toString(),
          name: other?.name ?? "Member",
          // The other participant's id lets the app open their profile from the chat.
          userId: other?._id?.toString(),
          last: c.lastMessageText,
          time: c.lastMessageAt,
          unread: Number(c.unreadCounts?.get?.(req.userId!) ?? 0),
        };
      }),
    });
  }),
);

// POST /api/chats/:id/read — opening a chat zeroes my unread counter for it
router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const conversation = await findMyConversation(req.params.id, req.userId!);
    await conversation.updateOne({ $set: { [`unreadCounts.${req.userId}`]: 0 } });
    // The message notifications for this chat are now stale — mark them read too.
    await Notification.updateMany(
      { user: req.userId, type: "Chats", chatId: req.params.id, read: false },
      { read: true },
    );
    res.json({ ok: true });
  }),
);

// POST /api/chats { withUserId } — find or create a 1:1 conversation
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { withUserId } = req.body ?? {};
    if (!withUserId) throw new HttpError(400, "withUserId is required");
    if (!(await User.findById(withUserId))) throw new HttpError(404, "User not found");
    // 404 (not 403) so a blocked user can't confirm they were blocked.
    if (await isBlockedEitherWay(req.userId!, withUserId)) throw new HttpError(404, "User not found");

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, withUserId], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.userId, withUserId] });
    }
    res.status(201).json({ chatId: conversation._id.toString() });
  }),
);

// GET /api/chats/:id/messages — chronological messages (poll for now; sockets post-launch)
router.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    await findMyConversation(req.params.id, req.userId!);
    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate(SHARED_POST_POPULATE);

    res.json({
      messages: messages.map((m: any) => ({
        id: m._id.toString(),
        mine: m.sender.toString() === req.userId,
        text: m.text,
        image: m.image,
        // Full card shape so the app can render it and open PostDetails from it.
        // A since-deleted post populates to null and the card simply doesn't render.
        sharedPost: m.sharedPost ? shapePost(m.sharedPost, req.userId!) : null,
        diyaCard: m.diyaCard ?? null,
        time: m.createdAt,
      })),
    });
  }),
);

// POST /api/chats/:id/messages { text?, image?, sharedPostId? } — text, a photo,
// a shared post (renders as a tappable post card on the other side), or any mix.
// `image` is a base64 data-URI (~6MB max), the same MVP transport posts use until
// cloud media storage lands.
router.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const text = cleanOptionalString(req.body?.text, "text", { max: 2000 }) ?? "";
    const image = cleanOptionalString(req.body?.image, "image", { max: 8_000_000 }) ?? null;
    const sharedPostId = cleanOptionalString(req.body?.sharedPostId, "sharedPostId", { max: 40 });
    const diyaId = cleanOptionalString(req.body?.diyaId, "diyaId", { max: 40 });
    if (!text && !image && !sharedPostId) {
      throw new HttpError(400, "A message needs text, a photo or a shared post");
    }

    let sharedPost: any = null;
    if (sharedPostId) {
      sharedPost = await Post.findById(sharedPostId).populate([
        { path: "author", select: "name" },
        { path: "group", select: "name" },
      ]);
      if (!sharedPost) throw new HttpError(404, "That post no longer exists");
    }

    // A diya reply carries a snapshot card (diyas expire in 24h; the card must
    // outlive them). Missing/expired diya just means no card — the text still sends.
    let diyaCard: { name: string; mood: string; note: string } | null = null;
    if (diyaId) {
      const diya: any = await Diya.findById(diyaId).populate("user", "name");
      if (diya) {
        diyaCard = {
          name: diya.user?.name ?? "Member",
          mood: diya.mood,
          note: (diya.note ?? "").slice(0, 140),
        };
      }
    }

    const conversation = await findMyConversation(req.params.id, req.userId!);

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text,
      image,
      sharedPost: sharedPost?._id ?? null,
      diyaCard,
    });
    const preview = text || (sharedPost ? "📄 Shared a post" : "📷 Photo");
    const others = conversation.participants
      .map((p: any) => p.toString())
      .filter((id: string) => id !== req.userId);
    // Everyone but the sender gains an unread ($inc is atomic — parallel sends can't lose counts).
    const unreadInc = Object.fromEntries(others.map((id: string) => [`unreadCounts.${id}`, 1]));
    await conversation.updateOne({
      lastMessageAt: new Date(),
      lastMessageText: preview,
      $inc: unreadInc,
    });

    const shapeFor = (userId: string) => (sharedPost ? shapePost(sharedPost, userId) : null);

    // Realtime fan-out: everyone in the room gets the message instantly; the other
    // participant's devices also get a chat-list nudge even with the room closed.
    // `senderId` (not `mine`) because one event goes to both sides — each client
    // compares it against its own user id.
    const chatId = conversation._id.toString();
    emitToChat(chatId, "message:new", {
      chatId,
      message: {
        id: message._id.toString(),
        senderId: req.userId,
        text,
        image,
        sharedPost: shapeFor(req.userId!),
        diyaCard,
        time: message.createdAt,
      },
    });
    const sender = await User.findById(req.userId, "name");
    const senderName = sender?.name ?? "Member";
    for (const otherId of others) {
      // `fromName`/`fromUserId` let the app show a "New message" popup and open the
      // right chat from it; older clients that only read `last`/`time` still work.
      emitToUser(otherId, "chat:updated", {
        chatId,
        last: preview,
        time: message.createdAt,
        fromUserId: req.userId,
        fromName: senderName,
      });
    }

    // Notifications-page entry (unless the recipient turned chat notifications off).
    // One entry per conversation: the previous unread one is replaced, so a chatty
    // sathi shows as a single fresh notification instead of flooding the page.
    const recipients = await User.find({ _id: { $in: others } }, "notifyOnMessages");
    for (const recipient of recipients) {
      if (recipient.notifyOnMessages === false) continue;
      await Notification.deleteMany({
        user: recipient._id,
        type: "Chats",
        chatId,
        read: false,
      });
      await Notification.create({
        user: recipient._id,
        type: "Chats",
        title: `New message from ${senderName}`,
        message: preview,
        chatId,
      });
    }

    res.status(201).json({
      message: {
        id: message._id.toString(),
        mine: true,
        text,
        image,
        sharedPost: shapeFor(req.userId!),
        time: message.createdAt,
      },
    });
  }),
);

export default router;
