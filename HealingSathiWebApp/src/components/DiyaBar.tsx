"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { fileToCompressedDataUri } from "@/lib/compressImage";
import { cn } from "@/lib/cn";

/**
 * Diya — HealingSathi's daily ritual (see DiyaFeature.md). A story ring bar:
 * up to 20 diyas a day, each live for 24h, visible to sathis only. Viewing a
 * sathi's diyas steps through them with segmented progress; replies go into
 * the 1:1 chat carrying a small reference card of the diya they answer.
 * The flame (streak) is gentle by design: a missed day rests it, never nags.
 */

// The healing mood palette — feelings first, no forced positivity. Text-only,
// matching the design system's single-accent icon language.
export const DIYA_MOODS = [
  { key: "bright", label: "Bright day" },
  { key: "steady", label: "Steady" },
  { key: "managing", label: "Managing" },
  { key: "heavy", label: "Heavy" },
  { key: "resting", label: "Resting" },
  { key: "small-win", label: "Small win" },
];

type DiyaShape = {
  id: string;
  mood: string;
  note: string;
  photo: string | null;
  time: string;
  supportCount: number;
  supported: boolean;
};

type CircleEntry = {
  user: { id: string; name: string; avatarColor?: string; avatarUrl?: string | null };
  streak: number;
  diyas: DiyaShape[];
};

type DiyaData = {
  mine: { litToday: boolean; streak: number; diyas: DiyaShape[] };
  circle: CircleEntry[];
};

const DEMO_DATA: DiyaData = {
  mine: { litToday: false, streak: 0, diyas: [] },
  circle: [
    {
      user: { id: "d1", name: "Alex K." },
      streak: 12,
      diyas: [
        { id: "dd1", mood: "small-win", note: "Walked to the park without a flare. Tiny, huge.", photo: null, time: "", supportCount: 4, supported: false },
      ],
    },
    {
      user: { id: "d2", name: "Maya Harrison" },
      streak: 5,
      diyas: [
        { id: "dd2", mood: "managing", note: "Rough morning, better evening. Pacing works.", photo: null, time: "", supportCount: 2, supported: true },
      ],
    },
  ],
};

// Custom moods are stored as their own text — show them verbatim.
const moodOf = (key: string) => DIYA_MOODS.find((m) => m.key === key) ?? { key, label: key };

export default function DiyaBar() {
  const { isAuthenticated, user } = useAuth();
  const [lighting, setLighting] = useState(false);
  const [viewing, setViewing] = useState<CircleEntry | null>(null);

  // 45s silent poll + refetch-on-focus: a sathi's freshly lit diya appears
  // in your bar (and yours in theirs) without anyone reloading.
  const { data, isLive, refresh } = useLiveData<DiyaData>(
    ["diyas"],
    async () => resourcesApi.getDiyas(),
    DEMO_DATA,
    { pollMs: 45_000 },
  );

  const mine = data.mine;

  return (
    <div className="animate-fade-up rounded-2xl border border-line bg-card p-3 shadow-soft">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* Your diya — your avatar; brand ring when lit, dashed ring + "+" until then */}
        <button onClick={() => setLighting(true)} className="group w-16 shrink-0 text-center">
          <span
            className={cn(
              "relative mx-auto flex h-16 w-16 items-center justify-center rounded-full p-[3px] transition-transform group-hover:scale-105",
              mine.diyas.length > 0
                ? "bg-gradient-to-tr from-primary to-primary-dark"
                : "border-2 border-dashed border-line bg-transparent",
            )}
          >
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-card">
              <UserAvatar name={user?.name ?? "You"} src={user?.avatarUrl} color={user?.avatarColor} size={54} />
            </span>
            {mine.litToday && mine.streak > 0 ? (
              <span className="absolute -right-1 -bottom-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {mine.streak}
              </span>
            ) : null}
            {!mine.litToday ? (
              <span className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                +
              </span>
            ) : null}
          </span>
          <span className="mt-1 block truncate text-caption font-semibold text-ink">
            {mine.diyas.length > 0 ? "Your diya" : "Light yours"}
          </span>
        </button>

        {/* The circle */}
        {data.circle.map((entry) => (
          <button key={entry.user.id} onClick={() => setViewing(entry)} className="group w-16 shrink-0 text-center">
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-dark p-[3px] transition-transform group-hover:scale-105">
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-card">
                <UserAvatar name={entry.user.name} src={entry.user.avatarUrl} color={entry.user.avatarColor} size={54} />
              </span>
            </span>
            <span className="mt-1 block truncate text-caption text-muted">{entry.user.name.split(" ")[0]}</span>
          </button>
        ))}

        {data.circle.length === 0 && mine.diyas.length > 0 ? (
          <p className="self-center pl-2 text-caption text-muted">
            Your diya is lit for your sathis to see.
          </p>
        ) : null}
      </div>

      {!isLive ? (
        <p className="mt-1 border-t border-line pt-1.5 text-caption text-muted">
          Demo diyas — sign in to light yours for your circle.
        </p>
      ) : null}

      {lighting ? (
        <LightDiyaDialog
          canLight={isAuthenticated && isLive}
          litCount={mine.diyas.length}
          streak={mine.streak}
          userName={user?.name}
          onClose={() => setLighting(false)}
          onLit={() => {
            refresh();
            setLighting(false);
          }}
        />
      ) : null}

      {viewing ? (
        <ViewDiyaDialog entry={viewing} canInteract={isLive} onClose={() => setViewing(null)} onChanged={refresh} />
      ) : null}
    </div>
  );
}

/** Light a new diya (up to 20/day): pick a mood, optionally add a thought/photo. */
function LightDiyaDialog({
  canLight,
  litCount,
  streak,
  userName,
  onClose,
  onLit,
}: {
  canLight: boolean;
  litCount: number;
  streak: number;
  userName?: string;
  onClose: () => void;
  onLit: () => void;
}) {
  const [mood, setMood] = useState("");
  // A custom mood word — same idea as the preset chips, in the user's own words.
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!mood) {
      setError("Pick how this moment feels — that's the whole ritual.");
      return;
    }
    if (!canLight) {
      setError("Demo mode can't light a diya — sign in first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resourcesApi.lightDiya({ mood, note: note.trim() || undefined, photo });
      onLit();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't light your diya"));
      setBusy(false);
    }
  };

  // Portal to <body>: the DiyaBar card animates with a transform, which would
  // otherwise hijack position:fixed and pin this dialog to the card, not the screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Light your diya"
        className="animate-fade-up w-full max-w-md rounded-t-2xl border border-line bg-card p-5 shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-subtitle font-bold text-ink">
          {`Light a diya${userName ? `, ${userName.split(" ")[0]}` : ""}`}
        </h2>
        <p className="mt-1 text-caption text-muted">
          One honest moment. Your sathis see it for 24 hours.
          {streak > 1 ? ` Flame: ${streak} days.` : ""}
          {litCount > 0 ? ` Lit today: ${litCount}/20.` : ""}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {DIYA_MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMood(m.key);
                setCustom("");
              }}
              aria-pressed={mood === m.key}
              className={cn(
                "rounded-full border px-2 py-2 text-caption font-semibold transition-all",
                mood === m.key
                  ? "border-primary bg-primary text-white shadow-soft"
                  : "border-line bg-card text-muted hover:bg-light-blue hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Your own word, if none of the chips fit */}
        <input
          value={custom}
          maxLength={40}
          onChange={(e) => {
            setCustom(e.target.value);
            setMood(e.target.value.trim());
          }}
          placeholder="Or your own word... (e.g. Hopeful)"
          className={cn(
            "mt-2 w-full rounded-full border px-3.5 py-2 text-caption text-ink placeholder:text-muted focus:outline-none",
            custom.trim() ? "border-primary bg-light-purple" : "border-line bg-light-blue focus:border-primary",
          )}
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A thought, if you have one... (optional)"
          className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="text-caption font-semibold text-primary hover:underline"
          >
            {photo ? "Change photo" : "+ Add a photo (optional)"}
          </button>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <button onClick={() => setPhoto(null)} className="text-caption text-muted underline hover:text-ink">
                Remove
              </button>
            </>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setPhoto(await fileToCompressedDataUri(file));
            e.target.value = "";
          }}
        />

        {error ? <p className="mt-2 text-caption font-semibold text-danger">{error}</p> : null}

        <Button className="mt-4" onClick={submit} disabled={busy}>
          {busy ? "Lighting…" : "Light it"}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

/** A sathi's diyas, story-style: segmented progress, hold, and an inline reply
 *  bar whose message lands in the 1:1 chat with a card referencing this diya. */
function ViewDiyaDialog({
  entry,
  canInteract,
  onClose,
  onChanged,
}: {
  entry: CircleEntry;
  canInteract: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [index, setIndex] = useState(0);
  const diya = entry.diyas[Math.min(index, entry.diyas.length - 1)];
  const mood = moodOf(diya.mood);

  const [supported, setSupported] = useState(diya.supported);
  const [count, setCount] = useState(diya.supportCount);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const goTo = (i: number) => {
    if (i < 0 || i >= entry.diyas.length) return;
    setIndex(i);
    setSupported(entry.diyas[i].supported);
    setCount(entry.diyas[i].supportCount);
    setSent(false);
  };

  const hold = async () => {
    if (!canInteract) return;
    const prev = { supported, count };
    setSupported(!supported);
    setCount((c) => c + (supported ? -1 : 1));
    try {
      const res = await resourcesApi.supportDiya(diya.id);
      setSupported(res.supported);
      setCount(res.supportCount);
      onChanged();
    } catch {
      setSupported(prev.supported);
      setCount(prev.count);
    }
  };

  // Inline story reply → the 1:1 chat, tagged with this diya's reference card.
  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !canInteract || sending) return;
    setSending(true);
    try {
      const chatId = await resourcesApi.openChatWith(entry.user.id);
      await resourcesApi.sendMessage(chatId, { text, diyaId: diya.id });
      setReply("");
      setSent(true);
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't send your reply"));
    } finally {
      setSending(false);
    }
  };

  // Same portal reason as LightDiyaDialog — escape the bar's animated transform.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.user.name}'s diya`}
        className="animate-fade-up w-full max-w-md overflow-hidden rounded-t-2xl border border-line bg-card shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Segmented story progress — one segment per diya */}
        {entry.diyas.length > 1 ? (
          <div className="flex gap-1 px-4 pt-3">
            {entry.diyas.map((d, i) => (
              <button
                key={d.id}
                aria-label={`Diya ${i + 1} of ${entry.diyas.length}`}
                onClick={() => goTo(i)}
                className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-primary" : "bg-line")}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3 bg-gradient-to-br from-light-purple/70 to-light-blue/60 px-5 py-4">
          <UserAvatar name={entry.user.name} src={entry.user.avatarUrl} color={entry.user.avatarColor} size={44} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-step font-bold text-ink">{entry.user.name}</span>
            <span className="text-caption text-muted">
              {mood.label}
              {entry.streak > 1 ? ` · ${entry.streak}-day flame` : ""}
              {entry.diyas.length > 1 ? ` · ${index + 1}/${entry.diyas.length}` : ""}
            </span>
          </span>
          {index > 0 ? (
            <button aria-label="Previous diya" onClick={() => goTo(index - 1)} className="px-1 text-body text-muted hover:text-ink">
              ‹
            </button>
          ) : null}
          {index < entry.diyas.length - 1 ? (
            <button aria-label="Next diya" onClick={() => goTo(index + 1)} className="px-1 text-body text-muted hover:text-ink">
              ›
            </button>
          ) : null}
          <button aria-label="Close" onClick={onClose} className="rounded-full px-2 py-0.5 text-body text-muted hover:text-ink">
            ✕
          </button>
        </div>

        <div className="p-5">
          {diya.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={diya.photo} alt="" className="mb-3 max-h-80 w-full rounded-xl object-cover" />
          ) : null}
          {diya.note ? (
            <p className="text-body leading-relaxed text-ink">{diya.note}</p>
          ) : (
            <p className="text-step text-muted">
              {entry.user.name.split(" ")[0]} lit a diya — showing up is the whole message.
            </p>
          )}

          <button
            onClick={hold}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-step font-semibold transition-all active:scale-[0.98]",
              supported
                ? "border-primary bg-light-purple text-primary"
                : "border-line bg-card text-ink hover:bg-light-blue",
            )}
          >
            <Icon name={supported ? "liked" : "heart"} size={16} />
            {supported ? "Holding them" : "Hold them"}
            {count > 0 ? <span className="text-caption text-muted">· {count}</span> : null}
          </button>

          {/* Inline reply — lands in your chat with a card referencing this diya */}
          <div className="mt-3 flex items-center gap-2">
            <input
              value={reply}
              onChange={(e) => {
                setReply(e.target.value);
                setSent(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendReply();
              }}
              maxLength={2000}
              placeholder={sent ? "Sent ✓ — say more?" : `Reply to ${entry.user.name.split(" ")[0]}...`}
              className="min-w-0 flex-1 rounded-full border border-line bg-light-blue px-4 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <button
              aria-label="Send reply"
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-dark text-white shadow-sm shadow-primary/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
