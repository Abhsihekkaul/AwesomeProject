import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "./config/env";
import {
  Consultant,
  ConsultantApplication,
  Conversation,
  Group,
  HealthTip,
  Message,
  Notification,
  PasswordReset,
  Post,
  SathiRequest,
  User,
} from "./models";

/**
 * Seeds a demo account + enough content that the app feels alive on first run.
 * Idempotent: wipes and recreates ONLY the demo data each time (safe to re-run).
 *
 * Real accounts (anything not @healingsathi.dev) and their content SURVIVE a
 * re-seed — an earlier version wiped every user, which silently deleted tester
 * accounts between sessions.
 *
 *   npm run seed
 *
 * Demo credentials (same ones the app's AuthContext knows about):
 *   patient@healingsathi.dev / password123
 */
const DEMO_EMAIL_RE = /@healingsathi\.dev$/;
const DEMO_GROUP_NAMES = ["Fibromyalgia Warriors", "Type 2 Diabetes", "Long COVID Recovery"];

const seed = async () => {
  await mongoose.connect(env.mongoUri);
  console.log("✓ Connected — seeding...");

  const demoUsers = await User.find({ email: DEMO_EMAIL_RE }, "_id");
  const demoIds = demoUsers.map((u) => u._id);

  await Promise.all([
    Post.deleteMany({ author: { $in: demoIds } }),
    Conversation.deleteMany({ participants: { $in: demoIds } }),
    Message.deleteMany({ sender: { $in: demoIds } }),
    Notification.deleteMany({ user: { $in: demoIds } }),
    SathiRequest.deleteMany({ $or: [{ from: { $in: demoIds } }, { to: { $in: demoIds } }] }),
    PasswordReset.deleteMany({ user: { $in: demoIds } }),
    ConsultantApplication.deleteMany({ user: { $in: demoIds } }),
    // Groups, consultants and tips are demo-owned directory content — safe to recreate.
    Group.deleteMany({ name: { $in: DEMO_GROUP_NAMES } }),
    Consultant.deleteMany({}),
    HealthTip.deleteMany({}),
  ]);
  await User.deleteMany({ email: DEMO_EMAIL_RE });

  const passwordHash = await bcrypt.hash("password123", 10);
  const [demo, alex, maya] = await User.create(
    { email: "patient@healingsathi.dev", passwordHash, name: "Abhishek", conditions: ["Fibromyalgia", "Type 2 Diabetes"] },
    { email: "alex@healingsathi.dev", passwordHash, name: "Alex K.", conditions: ["Fibromyalgia"] },
    { email: "maya@healingsathi.dev", passwordHash, name: "Maya Harrison", conditions: ["Long COVID"] },
  );
  // Superuser for the review queue (group proposals + consultant applications).
  // Sign in with this account → Settings → Admin → Review queue.
  await User.create({
    email: "admin@healingsathi.dev",
    passwordHash,
    name: "HealingSathi Team",
    role: "admin",
  });

  // Demo ↔ Alex are sathis: the demo feed shows a friend's posts, and Maya stays
  // discoverable through Search → "+ Add Sathi".
  await User.findByIdAndUpdate(demo._id, { $addToSet: { sathis: alex._id } });
  await User.findByIdAndUpdate(alex._id, { $addToSet: { sathis: demo._id } });
  await SathiRequest.create({ from: alex._id, to: demo._id, status: "accepted" });

  const [fibro, diabetes] = await Group.create(
    { name: "Fibromyalgia Warriors", tag: "Chronic Pain", moderator: "Dr. Priya Patel", members: [demo._id, alex._id], description: "A supportive community for people living with fibromyalgia." },
    { name: "Type 2 Diabetes", tag: "Metabolic", moderator: "Dr. Marcus Williams", members: [demo._id], description: "Managing T2D together — diet, meds, and morale." },
    { name: "Long COVID Recovery", tag: "Post-Viral", moderator: "Dr. James Lin", members: [maya._id], description: "Pacing, recovery and hope after COVID." },
  );

  await Post.create(
    { author: maya._id, group: fibro._id, content: "Finally found a sleep routine that works for me. Warm bath, no screens after 9, and the 4-7-8 breathing technique.", supports: [demo._id, alex._id], helpfuls: [demo._id], comments: [{ author: alex._id, text: "The 4-7-8 technique changed my sleep quality too!" }] as any },
    { author: alex._id, group: fibro._id, content: "Pacing myself instead of pushing through pain has been the single biggest improvement this year.", supports: [maya._id] },
    { author: demo._id, group: diabetes._id, title: "Small wins", content: "Post-meal walks for two weeks straight — morning readings finally trending down." },
  );

  const conversation = await Conversation.create({
    participants: [demo._id, alex._id],
    lastMessageText: "Anytime. And if you're having a rough day, remember you're not facing it alone.",
  });
  await Message.create(
    { conversation: conversation._id, sender: alex._id, text: "I've found that pacing myself and not pushing through pain helps the most. What's been your biggest challenge lately?" },
    { conversation: conversation._id, sender: demo._id, text: "Definitely the unpredictability. I've been trying journaling — it helps me notice patterns." },
    { conversation: conversation._id, sender: alex._id, text: "Anytime. And if you're having a rough day, remember you're not facing it alone." },
  );

  const [chen] = await Consultant.create(
    { name: "Dr. Sarah Chen", role: "Clinical Psychologist", bio: "12 years helping people navigate the emotional side of chronic illness.", rating: 4.9, reviewCount: 127, tags: ["Chronic Illness Adaptation", "Health Anxiety", "CBT"], languages: ["English", "Mandarin"] },
    { name: "Dr. Marcus Williams", role: "Psychiatrist", rating: 4.8, reviewCount: 98, tags: ["Mood Disorders", "Trauma & PTSD"], languages: ["English"] },
    { name: "Dr. Priya Patel", role: "Licensed Counselor", rating: 4.95, reviewCount: 203, tags: ["Grief & Loss", "Chronic Pain"], languages: ["English", "Hindi"] },
  );

  await HealthTip.create(
    { type: "Article", title: "Pacing 101: escape the boom-and-bust cycle", summary: "Why doing 70% of what you can on good days protects your bad days.", authorName: "Dr. Sarah Chen", condition: "Fibromyalgia", duration: "4 min read" },
    { type: "Video", title: "5 gentle bed stretches for morning stiffness", summary: "Follow along before you get up — no equipment needed.", authorName: "Dr. Priya Patel", condition: "Chronic Pain", duration: "6 min watch" },
    { type: "Article", title: "Understanding blood sugar spikes after meals", summary: "The order you eat food in matters more than you think.", authorName: "Dr. Marcus Williams", condition: "Diabetes", duration: "5 min read" },
  );

  await Notification.create(
    { user: demo._id, type: "Groups", title: "Jamie replied to your post", message: "Yes! The 4-7-8 technique completely changed my sleep quality." },
    { user: demo._id, type: "System", title: `${chen.name} has availability`, message: "A new appointment slot is available tomorrow." },
    { user: demo._id, type: "System", title: "Welcome to HealingSathi", message: "Your profile is ready. Explore the community.", read: true },
  );

  console.log("✓ Seeded. Demo login: patient@healingsathi.dev / password123");
  console.log("✓ Admin login: admin@healingsathi.dev / password123 (Settings → Admin → Review queue)");
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
