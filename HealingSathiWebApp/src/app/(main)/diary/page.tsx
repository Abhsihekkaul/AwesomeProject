"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import {
  decryptText,
  deriveDiaryKey,
  encryptText,
  makeKeyCheck,
  makeSalt,
  verifyKey,
} from "@/lib/diaryCrypto";
import { cn } from "@/lib/cn";

/**
 * Healing Diary v2 — sealed pages in OUR database, readable by NO ONE but
 * you: every page is encrypted on this device (AES-256-GCM, key derived from
 * your diary passphrase) before it travels. The server stores ciphertext it
 * cannot open; the same passphrase opens the same pages on your phone.
 * Old device-only entries are imported into the sealed diary on first unlock.
 */

type SealedEntry = { id: string; ciphertext: string; iv: string; time: string; edited?: boolean };
type OpenEntry = { id: string; time: string; text: string; mood?: string; edited?: boolean; unreadable?: boolean };
type DiaryMeta = { salt: string; checkCiphertext: string; checkIv: string };

const MOODS = [
  { key: "calm", label: "Calm", glyph: "🌤" },
  { key: "hopeful", label: "Hopeful", glyph: "🌱" },
  { key: "grateful", label: "Grateful", glyph: "✨" },
  { key: "heavy", label: "Heavy", glyph: "🌧" },
  { key: "anxious", label: "Anxious", glyph: "🌪" },
  { key: "tired", label: "Tired", glyph: "🕯" },
];

const moodOf = (key?: string) => MOODS.find((m) => m.key === key);

const LEGACY_KEY = "healingsathi:diary";

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** The dusk-gradient hero every diary state shares. */
function DiaryHero({ subtitle, right }: { subtitle: string; right?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b2350] via-primary-dark to-primary p-6 text-white shadow-lift">
      <span aria-hidden className="absolute -top-12 -right-8 h-44 w-44 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />
      <span aria-hidden className="absolute top-6 right-24 text-lg opacity-60">✦</span>
      <span aria-hidden className="absolute top-14 right-10 text-xs opacity-40">✦</span>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-heading font-bold">Healing Diary</h1>
          <p className="mt-1 max-w-md text-step leading-snug opacity-90">{subtitle}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-caption font-bold">
            🔒 End-to-end encrypted — only you hold the key
          </p>
        </div>
        {right}
      </div>
    </header>
  );
}

export default function DiaryPage() {
  const { isAuthenticated } = useAuth();

  const [meta, setMeta] = useState<DiaryMeta | null | undefined>(undefined); // undefined = not fetched
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<OpenEntry[]>([]);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);

  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<OpenEntry | null>(null);

  const decryptAll = useCallback(async (k: CryptoKey, sealed: SealedEntry[]): Promise<OpenEntry[]> => {
    return Promise.all(
      sealed.map(async (e) => {
        try {
          const payload = JSON.parse(await decryptText(k, e.ciphertext, e.iv));
          return { id: e.id, time: e.time, text: payload.text ?? "", mood: payload.mood, edited: e.edited };
        } catch {
          // A page from a different passphrase era — shown honestly as sealed.
          return { id: e.id, time: e.time, text: "", unreadable: true };
        }
      }),
    );
  }, []);

  /** Old device-only entries → encrypted pages, then the local copy is cleared. */
  const migrateLegacy = useCallback(async (k: CryptoKey) => {
    try {
      const raw = window.localStorage.getItem(LEGACY_KEY);
      if (!raw) return 0;
      const legacy: { text: string }[] = JSON.parse(raw);
      let count = 0;
      for (const item of legacy) {
        if (!item.text) continue;
        await resourcesApi.addDiaryEntry(await encryptText(k, JSON.stringify({ text: item.text })));
        count += 1;
      }
      window.localStorage.removeItem(LEGACY_KEY);
      return count;
    } catch {
      return 0;
    }
  }, []);

  const unlock = async () => {
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { meta: fetchedMeta, entries: sealed } = await resourcesApi.getDiary();
      if (!fetchedMeta) {
        // First time: create the diary.
        if (passphrase.length < 8) {
          setError("Choose a passphrase of at least 8 characters — it is the only key to these pages.");
          return;
        }
        if (passphrase !== confirm) {
          setError("The two passphrases don't match.");
          return;
        }
        const salt = makeSalt();
        const k = await deriveDiaryKey(passphrase, salt);
        const check = await makeKeyCheck(k);
        const created = await resourcesApi.setupDiary({ salt, checkCiphertext: check.ciphertext, checkIv: check.iv });
        setMeta(created);
        setKey(k);
        const migrated = await migrateLegacy(k);
        setImported(migrated);
        if (migrated > 0) {
          const { entries: refreshed } = await resourcesApi.getDiary();
          setEntries(await decryptAll(k, refreshed));
        } else {
          setEntries([]);
        }
      } else {
        const k = await deriveDiaryKey(passphrase, fetchedMeta.salt);
        if (!(await verifyKey(k, fetchedMeta.checkCiphertext, fetchedMeta.checkIv))) {
          setError("That passphrase doesn't open this diary.");
          return;
        }
        setMeta(fetchedMeta);
        setKey(k);
        const migrated = await migrateLegacy(k);
        setImported(migrated);
        const { entries: refreshed } = migrated > 0 ? await resourcesApi.getDiary() : { entries: sealed };
        setEntries(await decryptAll(k, refreshed));
      }
      setPassphrase("");
      setConfirm("");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't open the diary"));
    } finally {
      setBusy(false);
    }
  };

  // Peek at whether the diary exists, so the lock screen says the right thing.
  const [checked, setChecked] = useState(false);
  const checkMeta = useCallback(async () => {
    try {
      const { meta: m } = await resourcesApi.getDiary();
      setMeta(m);
    } catch {
      setMeta(null);
    }
    setChecked(true);
  }, []);
  if (isAuthenticated && !checked && meta === undefined) void checkMeta();

  const save = async () => {
    const text = draft.trim();
    if (!text || !key || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = JSON.stringify({ text, mood });
      if (editing) {
        const updated = await resourcesApi.updateDiaryEntry(editing.id, await encryptText(key, payload));
        setEntries((prev) =>
          prev.map((e) => (e.id === editing.id ? { ...e, text, mood, edited: updated.edited } : e)),
        );
        setEditing(null);
      } else {
        const created: SealedEntry = await resourcesApi.addDiaryEntry(await encryptText(key, payload));
        setEntries((prev) => [{ id: created.id, time: created.time, text, mood }, ...prev]);
      }
      setDraft("");
      setMood(undefined);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't seal this page"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: OpenEntry) => {
    if (!window.confirm("Burn this page? It can't be recovered.")) return;
    try {
      await resourcesApi.deleteDiaryEntry(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't delete"));
    }
  };

  const lock = () => {
    setKey(null);
    setEntries([]);
    setDraft("");
    setEditing(null);
  };

  // ---------- Signed out ----------
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <DiaryHero subtitle="A sealed place for the thoughts you don't post. Encrypted on your device — not even we can read a page." />
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted shadow-soft">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to open your diary — the same passphrase unlocks it on every device.
        </p>
      </div>
    );
  }

  // ---------- Locked: create or unlock ----------
  if (!key) {
    const creating = checked && meta === null;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <DiaryHero
          subtitle={
            creating
              ? "Choose a passphrase to seal your diary. Every page is encrypted on this device before it travels."
              : "Your pages are sealed. Enter your diary passphrase to open them."
          }
        />
        <div className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <h2 className="text-step font-bold text-ink">{creating ? "Create your diary" : "Open your diary"}</h2>
          {error ? <p className="mt-2 text-caption font-medium text-danger">{error}</p> : null}
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !creating && unlock()}
            placeholder={creating ? "A passphrase you'll remember (8+ characters)" : "Your diary passphrase"}
            className="mt-3 w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />
          {creating ? (
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              placeholder="Type it once more"
              className="mt-2 w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          ) : null}
          <Button className="mt-3" onClick={unlock} disabled={busy || !passphrase || !checked}>
            {busy ? "Opening..." : creating ? "Seal my diary" : "Open my diary"}
          </Button>
          <p className="mt-3 border-t border-line pt-3 text-caption leading-snug text-muted">
            {creating
              ? "⚠️ The passphrase never leaves your device and we cannot reset it. If it's forgotten, these pages stay sealed forever — that is what end-to-end encrypted means."
              : "The passphrase never leaves this device — it only derives the key that opens your pages here."}
          </p>
        </div>
      </div>
    );
  }

  // ---------- Open journal ----------
  const activeMood = moodOf(mood);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <DiaryHero
        subtitle={`${entries.length === 0 ? "Your first page is waiting." : `${entries.length} sealed page${entries.length === 1 ? "" : "s"}.`} Written for no one but you.`}
        right={
          <button
            onClick={lock}
            className="shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-caption font-bold text-white transition-colors hover:bg-white/25"
          >
            🔒 Lock
          </button>
        }
      />

      {imported > 0 ? (
        <p className="rounded-2xl bg-light-green p-3 text-center text-caption font-semibold text-success">
          {imported} page{imported === 1 ? "" : "s"} from this device {imported === 1 ? "was" : "were"} sealed into your diary — they now follow your account.
        </p>
      ) : null}

      {/* Tonight's page */}
      <div className="rounded-2xl border border-line bg-card p-4 shadow-soft">
        <p className="text-caption font-bold tracking-wide text-muted uppercase">
          {editing ? "Rewriting a page" : "Tonight's page"}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(mood === m.key ? undefined : m.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-caption font-semibold transition-colors",
                mood === m.key
                  ? "border-primary bg-light-purple text-primary"
                  : "border-line bg-page text-muted hover:text-ink",
              )}
            >
              {m.glyph} {m.label}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder={activeMood ? `Feeling ${activeMood.label.toLowerCase()} — let it out...` : "Let it out — this page is sealed before it leaves your device..."}
          className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step leading-relaxed text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        {error ? <p className="mt-2 text-caption font-medium text-danger">{error}</p> : null}
        <div className="mt-3 flex items-center gap-2">
          <Button className="w-auto" onClick={save} disabled={busy || !draft.trim()}>
            {busy ? "Sealing..." : editing ? "Reseal page" : "🔒 Seal this page"}
          </Button>
          {editing ? (
            <Button
              variant="outline"
              className="w-auto"
              onClick={() => {
                setEditing(null);
                setDraft("");
                setMood(undefined);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {/* The pages */}
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-8 text-center text-step text-muted shadow-soft">
          Empty for now — and completely yours. 💜
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const m = moodOf(entry.mood);
            return (
              <article key={entry.id} className="rounded-2xl border border-line bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <span className="text-caption font-bold text-muted">{dateLabel(entry.time)}</span>
                  {m ? (
                    <span className="rounded-full bg-light-purple px-2 py-0.5 text-[10px] font-bold text-primary">
                      {m.glyph} {m.label}
                    </span>
                  ) : null}
                  {entry.edited ? <span className="text-[10px] text-muted">· edited</span> : null}
                  <span className="ml-auto flex gap-2">
                    {!entry.unreadable ? (
                      <button
                        onClick={() => {
                          setEditing(entry);
                          setDraft(entry.text);
                          setMood(entry.mood);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-caption font-semibold text-muted hover:text-primary"
                      >
                        Edit
                      </button>
                    ) : null}
                    <button onClick={() => remove(entry)} className="text-caption font-semibold text-muted hover:text-danger">
                      Burn
                    </button>
                  </span>
                </div>
                {entry.unreadable ? (
                  <p className="mt-2 text-step text-muted italic">
                    🔒 Sealed with a different passphrase — this page can&apos;t be opened with the current one.
                  </p>
                ) : (
                  <p className="mt-2 text-step leading-relaxed whitespace-pre-wrap text-ink">{entry.text}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
