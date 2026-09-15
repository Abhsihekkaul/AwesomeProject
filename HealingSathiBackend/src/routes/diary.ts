import { Router } from "express";
import { DiaryEntry, DiaryMeta } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { cleanString } from "../utils/validate";

/**
 * E2EE Healing Diary — a zero-knowledge store. Every entry is encrypted ON
 * THE DEVICE (AES-256-GCM, key = PBKDF2 of the user's diary passphrase) and
 * arrives here as an opaque {ciphertext, iv} pair. The server can order,
 * count, and delete blobs; it can never read one. There is deliberately no
 * recovery path: a forgotten passphrase means the pages stay sealed.
 */

const router = Router();
router.use(requireAuth);

const MAX_BLOB = 500_000; // ~500kb ciphertext per page — plenty for text

const shapeEntry = (e: any) => ({
  id: e._id.toString(),
  ciphertext: e.ciphertext,
  iv: e.iv,
  time: e.createdAt,
  edited: e.updatedAt > e.createdAt,
});

// GET /api/diary — keying meta (null until the diary is set up) + all pages.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [meta, entries] = await Promise.all([
      DiaryMeta.findOne({ user: req.userId }),
      DiaryEntry.find({ user: req.userId }).sort({ createdAt: -1 }).limit(500),
    ]);
    res.json({
      meta: meta
        ? { salt: meta.salt, checkCiphertext: meta.checkCiphertext, checkIv: meta.checkIv }
        : null,
      entries: entries.map(shapeEntry),
    });
  }),
);

// POST /api/diary/meta { salt, checkCiphertext, checkIv } — one-time setup
// when the user creates their diary passphrase.
router.post(
  "/meta",
  asyncHandler(async (req, res) => {
    const existing = await DiaryMeta.findOne({ user: req.userId });
    if (existing) throw new HttpError(409, "Diary is already set up on this account");

    const meta = await DiaryMeta.create({
      user: req.userId,
      salt: cleanString(req.body?.salt, "salt", { max: 200 }),
      checkCiphertext: cleanString(req.body?.checkCiphertext, "checkCiphertext", { max: 2000 }),
      checkIv: cleanString(req.body?.checkIv, "checkIv", { max: 200 }),
    });
    res.status(201).json({
      meta: { salt: meta.salt, checkCiphertext: meta.checkCiphertext, checkIv: meta.checkIv },
    });
  }),
);

// POST /api/diary/entries { ciphertext, iv } — a new sealed page.
router.post(
  "/entries",
  asyncHandler(async (req, res) => {
    const entry = await DiaryEntry.create({
      user: req.userId,
      ciphertext: cleanString(req.body?.ciphertext, "ciphertext", { max: MAX_BLOB }),
      iv: cleanString(req.body?.iv, "iv", { max: 200 }),
    });
    res.status(201).json({ entry: shapeEntry(entry) });
  }),
);

// PATCH /api/diary/entries/:id { ciphertext, iv } — re-sealed after an edit.
router.patch(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    const entry: any = await DiaryEntry.findOne({ _id: req.params.id, user: req.userId });
    if (!entry) throw new HttpError(404, "Entry not found");
    entry.ciphertext = cleanString(req.body?.ciphertext, "ciphertext", { max: MAX_BLOB });
    entry.iv = cleanString(req.body?.iv, "iv", { max: 200 });
    await entry.save();
    res.json({ entry: shapeEntry(entry) });
  }),
);

// DELETE /api/diary/entries/:id
router.delete(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, user: req.userId });
    if (!entry) throw new HttpError(404, "Entry not found");
    await entry.deleteOne();
    res.json({ ok: true });
  }),
);

export default router;
