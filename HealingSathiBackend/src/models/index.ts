import mongoose, { Schema } from "mongoose";

/**
 * All Mongoose models in one place so the entire data model is scannable in a single read.
 * Conventions:
 *  - timestamps on everything (createdAt / updatedAt)
 *  - reaction/save relationships stored as arrays of user ObjectIds (fast $addToSet toggles)
 *  - comments embedded in the post (support-group threads are small; one read = whole thread)
 */

// ---------- User & auth ----------

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    // "admin" unlocks the review queue (group proposals, consultant applications).
    // Granted manually (seed / DB) — there is deliberately no self-serve path to admin.
    role: { type: String, enum: ["member", "admin"], default: "member" },
    avatarColor: { type: String, default: "purple" },
    avatarUrl: { type: String, default: null },
    // Profile cover/banner photo — same base64 data-URI transport as avatarUrl.
    coverUrl: { type: String, default: null },
    conditions: [{ type: String }],
    sathis: [{ type: Schema.Types.ObjectId, ref: "User" }], // accepted friends
    savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    // Chat notifications toggle (Settings): off = no message popups/notification
    // entries for this user. Unread counts still tick (like a muted chat).
    notifyOnMessages: { type: Boolean, default: true },
    // Users this account has blocked: hidden from search, can't chat or send sathi requests.
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Diya (the daily check-in ritual): consecutive-day flame + the last day
    // ("YYYY-MM-DD", UTC) it was lit. Deliberately gentle — a missed day resets
    // quietly to 1 on the next check-in, and nothing ever nags about it.
    diyaStreak: { type: Number, default: 0 },
    lastDiyaDay: { type: String, default: null },
  },
  { timestamps: true },
);

// ---------- Diya — the daily healing check-in (HealingSathi's "stories") ----------
// Up to 20 per user per day: a mood, an optional thought and/or photo. Each is
// live for 24h from creation; sathis see them in a story ring bar and can
// "hold" (support) them. `day` (UTC) drives the daily cap + streak tick.
const diyaSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true },
    mood: { type: String, required: true, maxlength: 40 },
    note: { type: String, default: "", maxlength: 500 },
    photo: { type: String, default: null }, // base64 data-URI, same transport as posts
    supports: [{ type: Schema.Types.ObjectId, ref: "User" }], // "holding you" hearts
  },
  { timestamps: true },
);
diyaSchema.index({ user: 1, day: 1 });
diyaSchema.index({ createdAt: 1 });

// Forgot-password codes: stored hashed (a DB leak must not leak live reset codes),
// short-lived, and attempt-capped against brute force. One active code per user.
const passwordResetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Passwordless sign-in codes ("email me a code") — same hardening as password resets:
// hashed at rest, short-lived, attempt-capped, one active code per user.
const loginCodeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);
loginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Refresh tokens are persisted so they can be revoked (sign-out kills the session server-side).
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
// TTL index: Mongo deletes expired refresh tokens automatically (~1 min sweep).
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ---------- Social graph ----------

const sathiRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { timestamps: true },
);
sathiRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// ---------- Groups ----------

const groupSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    tag: { type: String, default: "" },
    // Cover photo (data-URI, same MVP transport as avatars). Groups without
    // one get a deterministic healing-themed preset at response time.
    coverUrl: { type: String, default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    moderator: { type: String, default: "" },
    status: { type: String, enum: ["active", "proposed", "rejected"], default: "active" },
    // Group proposals (RequestGroupScreen) reuse this collection with status "proposed".
    proposal: {
      condition: String,
      population: String,
      reason: String,
      references: String,
      proposedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true },
);

// ---------- Posts, comments, reactions ----------

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    parentId: { type: String, default: null }, // flat threading: null = top-level
    supports: [{ type: Schema.Types.ObjectId, ref: "User" }], // ♥ on the comment itself
  },
  { timestamps: true, _id: true },
);

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null }, // null = personal feed
    title: { type: String, default: "" },
    content: { type: String, required: true },
    // Up to 10 photos per post (Instagram-style carousel in the app).
    // `image` stays as the first photo for older clients/records.
    image: { type: String, default: null },
    images: [{ type: String }],
    tags: [{ type: String }],
    contentWarning: { type: Boolean, default: false },
    supports: [{ type: Schema.Types.ObjectId, ref: "User" }], // ♥ reactions
    helpfuls: [{ type: Schema.Types.ObjectId, ref: "User" }], // 🤝 reactions
    comments: [commentSchema],
  },
  { timestamps: true },
);
postSchema.index({ createdAt: -1 });

// ---------- Chat ----------

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageText: { type: String, default: "" },
    // Per-participant unread counters keyed by user id — $inc'd on every message
    // to everyone but the sender, reset to 0 when that user opens the chat.
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);
conversationSchema.index({ participants: 1 });

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // A message carries text, an image (base64 data-URI, same MVP transport as posts),
    // and/or a shared post (in-app share renders as a tappable post card) —
    // the route rejects fully empty messages.
    text: { type: String, default: "" },
    image: { type: String, default: null },
    sharedPost: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    // A diya reply's reference card — a small snapshot (diyas expire in 24h,
    // so the card must outlive the diya itself).
    diyaCard: {
      type: new Schema(
        { name: String, mood: String, note: String },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);

// ---------- Consultants & bookings ----------

const consultantSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, default: "" },
    rating: { type: Number, default: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    languages: [{ type: String }],
    feeRange: { type: String, default: "$80–120/session" },
  },
  { timestamps: true },
);

// "Join as a consultant" applications — reviewed by the medical team before a
// Consultant profile is created (same approval pattern as group proposals).
const consultantApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true },
    specialty: { type: String, required: true },
    credentials: { type: String, required: true }, // degrees / certifications
    licenseNumber: { type: String, default: "" },
    yearsExperience: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    languages: [{ type: String }],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    consultant: { type: Schema.Types.ObjectId, ref: "Consultant", required: true },
    sessionType: { type: String, enum: ["Video", "Audio", "Chat"], default: "Video" },
    date: { type: String, required: true }, // display string for MVP; ISO datetime post-launch
    time: { type: String, required: true },
    note: { type: String, default: "" },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
  },
  { timestamps: true },
);

// ---------- Notifications ----------

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["Groups", "Chats", "System"], default: "System" },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
    // Message notifications carry their conversation so the app can open it; also
    // the key for collapsing repeated messages from one chat into a single entry.
    chatId: { type: String, default: null },
  },
  { timestamps: true },
);

// ---------- Exit feedback ----------

// Why people delete their accounts. Deliberately NOT linked to the (now gone)
// user — anonymous by design, kept purely so the product can learn and improve.
const exitFeedbackSchema = new Schema(
  {
    reason: { type: String, required: true }, // one of the app's preset options
    details: { type: String, default: "" }, // optional free-text "tell us more"
    memberForDays: { type: Number, default: 0 }, // how long they stayed
  },
  { timestamps: true },
);

// ---------- Health tips ----------

const healthTipSchema = new Schema(
  {
    type: { type: String, enum: ["Article", "Video", "Photo Guide"], default: "Article" },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    authorName: { type: String, required: true }, // doctor display name for MVP
    condition: { type: String, required: true },
    duration: { type: String, default: "" },
    // Full article body, one string per paragraph — powers the tip detail page.
    content: { type: [String], default: [] },
  },
  { timestamps: true },
);

// One user-day of the Healing Habits checklist (gamification): which task keys
// were ticked that day. Healing Points are always DERIVED from these records
// (10/task, +20 full-day bonus) — never stored, so they can't drift or be lost.
const habitDaySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true }, // UTC "YYYY-MM-DD", same convention as diyas
    completed: { type: [String], default: [] }, // task keys ticked
  },
  { timestamps: true },
);
habitDaySchema.index({ user: 1, day: 1 }, { unique: true });

// One sathi cheering another's habits, once per day (delivery goes through a
// Notification; this record just enforces the once-a-day and powers the UI state).
const habitCheerSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true },
  },
  { timestamps: true },
);
habitCheerSchema.index({ from: 1, to: 1, day: 1 }, { unique: true });

// ---------- E2EE Healing Diary ----------
// The server is DELIBERATELY BLIND here: entries arrive as AES-GCM ciphertext
// encrypted on the device with a key derived from the user's diary passphrase
// (PBKDF2). We store blobs we cannot read; losing the passphrase loses the
// pages — that is the design, and the UI says so.

// Per-user diary keying material (none of it secret: salt is public by
// design; the key-check ciphertext just lets the client verify a passphrase
// locally by round-tripping a known sentinel).
const diaryMetaSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    salt: { type: String, required: true },
    checkCiphertext: { type: String, required: true },
    checkIv: { type: String, required: true },
  },
  { timestamps: true },
);

const diaryEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
  },
  { timestamps: true },
);

// Questions/comments under a health tip (flat list — tips aren't threaded like posts).
const tipCommentSchema = new Schema(
  {
    tip: { type: Schema.Types.ObjectId, ref: "HealthTip", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
export const LoginCode = mongoose.model("LoginCode", loginCodeSchema);
export const ConsultantApplication = mongoose.model("ConsultantApplication", consultantApplicationSchema);
export const SathiRequest = mongoose.model("SathiRequest", sathiRequestSchema);
export const Group = mongoose.model("Group", groupSchema);
export const Post = mongoose.model("Post", postSchema);
export const Conversation = mongoose.model("Conversation", conversationSchema);
export const Message = mongoose.model("Message", messageSchema);
export const Diya = mongoose.model("Diya", diyaSchema);
// Dev-safety: drop the stale unique {user,day} index from before multi-diya days.
Diya.syncIndexes().catch(() => {});
export const Consultant = mongoose.model("Consultant", consultantSchema);
export const Booking = mongoose.model("Booking", bookingSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const ExitFeedback = mongoose.model("ExitFeedback", exitFeedbackSchema);
export const HealthTip = mongoose.model("HealthTip", healthTipSchema);
export const TipComment = mongoose.model("TipComment", tipCommentSchema);
export const HabitDay = mongoose.model("HabitDay", habitDaySchema);
export const HabitCheer = mongoose.model("HabitCheer", habitCheerSchema);
export const DiaryMeta = mongoose.model("DiaryMeta", diaryMetaSchema);
export const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);
