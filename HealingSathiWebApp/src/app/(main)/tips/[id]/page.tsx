"use client";

import { use, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import UserAvatar from "@/components/ui/UserAvatar";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { demoTipById, DEMO_TIPS, type Tip } from "@/lib/tips";
import { timeAgo } from "@/lib/timeAgo";

const TYPE_GLYPH: Record<string, string> = {
  Article: "📄",
  Video: "🎥",
  "Photo Guide": "🖼️",
};

type TipComment = {
  id: string;
  author: string;
  authorId: string;
  avatarColor?: string;
  avatarUrl?: string | null;
  text: string;
  time: string;
  mine: boolean;
};

// What the demo-mode conversation looks like — real questions, honest tone.
const DEMO_COMMENTS: TipComment[] = [
  { id: "dc1", author: "Alex K.", authorId: "d1", text: "The 70% rule finally made pacing click for me. Took about three weeks before it felt natural.", time: "2 days ago", mine: false },
  { id: "dc2", author: "Maya Harrison", authorId: "d2", text: "Question — does mental effort count toward the budget too? Meetings wipe me out as much as walks do.", time: "1 day ago", mine: false },
];

/**
 * A health tip's own page — like /post/[id] for posts: the full article with
 * a questions-and-experiences thread underneath, at a real shareable URL.
 */
export default function TipDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isAuthenticated } = useAuth();

  const { data: tip, isLive, loading } = useLiveData<Tip | null>(
    ["tip", id],
    async () => resourcesApi.getHealthTip(id),
    demoTipById(id) ?? DEMO_TIPS[0],
    { emptyData: null },
  );

  const { data: comments, refresh: refreshComments } = useLiveData<TipComment[]>(
    ["tip-comments", id],
    async () =>
      (await resourcesApi.getTipComments(id)).map((c: TipComment) => ({
        ...c,
        time: timeAgo(c.time),
      })),
    DEMO_COMMENTS,
    { pollMs: 20_000 },
  );

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await resourcesApi.addTipComment(id, text);
      setDraft("");
      refreshComments();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't post your question"));
    } finally {
      setSending(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await resourcesApi.deleteTipComment(commentId);
      refreshComments();
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't delete"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isLive && !tip) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-card p-8 text-center shadow-soft">
        <h1 className="text-body font-bold text-ink">This tip is gone</h1>
        <p className="mt-2 text-step text-muted">It may have been unpublished.</p>
        <Link href="/tips" className="mt-3 inline-block text-step font-semibold text-primary hover:underline">
          ← Back to Health Tips
        </Link>
      </div>
    );
  }
  if (!tip) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/tips" className="inline-block text-step font-semibold text-primary hover:underline">
        ← Health Tips
      </Link>

      {/* Article hero */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-lift">
        <span aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-14 -left-6 h-36 w-36 rounded-full bg-white/5" />
        <p className="flex flex-wrap items-center gap-2 text-caption font-semibold">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5">
            {TYPE_GLYPH[tip.type] ?? "📄"} {tip.type}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5">{tip.condition}</span>
          {tip.duration ? <span className="opacity-90">{tip.duration}</span> : null}
        </p>
        <h1 className="mt-2 text-heading leading-snug font-bold">{tip.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-caption font-semibold opacity-95">
          <UserAvatar name={tip.author.replace("Dr. ", "")} size={26} />
          {tip.author}
        </p>
      </header>

      {/* The article */}
      <article className="space-y-4 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
        {tip.summary ? (
          <p className="border-l-4 border-primary pl-3 text-step leading-relaxed font-medium text-ink">
            {tip.summary}
          </p>
        ) : null}
        {(tip.content ?? []).map((paragraph, i) => (
          <p key={i} className="text-step leading-relaxed text-ink">
            {paragraph}
          </p>
        ))}
        {(tip.content ?? []).length === 0 ? (
          <p className="text-step text-muted">The full article is on its way.</p>
        ) : null}
        <p className="border-t border-line pt-3 text-caption text-muted">
          General guidance, not personal medical advice — your own clinician knows your situation
          best.
        </p>
      </article>

      {/* Questions & experiences */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
        <h2 className="text-step font-bold text-ink">
          Questions & experiences{comments.length > 0 ? ` · ${comments.length}` : ""}
        </h2>
        <p className="mt-0.5 text-caption text-muted">
          Ask about this tip or share what worked for you — the community reads along.
        </p>

        <div className="mt-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-step text-muted">No questions yet — yours can be the first.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                {c.authorId && !c.mine ? (
                  <Link href={`/user/${c.authorId}`} className="shrink-0">
                    <UserAvatar name={c.author} src={c.avatarUrl} color={c.avatarColor} size={32} />
                  </Link>
                ) : (
                  <UserAvatar name={c.author} src={c.avatarUrl} color={c.avatarColor} size={32} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-caption">
                    <span className="font-bold text-ink">{c.author}</span>{" "}
                    <span className="text-muted">· {c.time}</span>
                  </p>
                  <p className="mt-0.5 text-step leading-snug whitespace-pre-wrap text-ink">
                    {c.text}
                  </p>
                  {c.mine ? (
                    <button
                      onClick={() => removeComment(c.id)}
                      className="mt-1 text-caption font-semibold text-muted hover:text-danger"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {isAuthenticated ? (
          <div className="mt-4 border-t border-line pt-4">
            {error ? <p className="mb-2 text-caption font-medium text-danger">{error}</p> : null}
            <div className="flex items-start gap-2.5">
              <UserAvatar
                name={user?.name ?? "?"}
                src={user?.avatarUrl}
                color={user?.avatarColor}
                size={32}
              />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Ask a question or share your experience..."
                className="flex-1 resize-none rounded-2xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button className="w-auto" onClick={submit} disabled={!draft.trim() || sending}>
                {sending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-line pt-4 text-step text-muted">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to ask a question or share your experience.
          </p>
        )}
      </section>
    </div>
  );
}
