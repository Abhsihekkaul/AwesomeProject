"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import UserAvatar from "@/components/ui/UserAvatar";
import Skeleton from "@/components/ui/Skeleton";
import BookingModal, { type SessionType } from "@/components/BookingModal";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { DEMO_CONSULTANTS, type Consultant } from "@/lib/consultants";
import { cn } from "@/lib/cn";

// The app's seed reviews (ConsultantProfileScreen). Reviews are local-only on
// both clients until a reviews endpoint exists — new ones live for the session.
const SEED_REVIEWS = [
  {
    name: "M. H.",
    date: "May 2025",
    text: "Dr. Chen helped me understand my health anxiety in ways no one else had. She's warm, patient, and genuinely gets it.",
    stars: "★★★★★",
  },
  {
    name: "T. K.",
    date: "Apr 2025",
    text: "The best therapist I have had for my fibro journey. She doesn't just address the mental side — she helps me cope with the physical reality too.",
    stars: "★★★★★",
  },
  {
    name: "R. S.",
    date: "Mar 2025",
    text: "Very professional and caring. Sessions are structured but never rigid. Highly recommend for anyone navigating chronic illness.",
    stars: "★★★★☆",
  },
];

// Same slots the app offers; value is what the booking API stores.
const TIME_SLOTS = [
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:30 PM", value: "17:30" },
];

const stars = (rating: number) => "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

/**
 * The app's ConsultantProfileScreen, web edition, at a real shareable URL:
 * hero + About + specialties + info tiles + session type/date/time picks
 * (pre-filling the booking dialog) + reviews. One upgrade over the app: the
 * date row is the REAL next six days, not a hardcoded week.
 */
export default function ConsultantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: consultants, isLive, loading } = useLiveData<Consultant[]>(
    ["consultants"],
    async () => resourcesApi.getConsultants(),
    DEMO_CONSULTANTS,
  );
  const consultant = consultants.find((c) => c.id === id);

  const days = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: d.getDate(),
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      };
    });
  }, []);

  const [sessionType, setSessionType] = useState<SessionType>("Video");
  const [date, setDate] = useState(days[0].value);
  const [time, setTime] = useState("15:00");
  const [booking, setBooking] = useState(false);

  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [writingReview, setWritingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");

  const submitReview = () => {
    if (!reviewDraft.trim()) return;
    setReviews([{ name: "Me", date: "Just now", text: reviewDraft.trim(), stars: "★★★★★" }, ...reviews]);
    setReviewDraft("");
    setWritingReview(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-6 text-center shadow-soft">
        <p className="text-step text-muted">This consultant isn&apos;t available anymore.</p>
        <Link href="/help" className="mt-2 inline-block text-step font-semibold text-primary hover:underline">
          ← Back to Psychological Help
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/help" aria-label="Back to Psychological Help" className="text-body font-bold text-primary hover:underline">
          ←
        </Link>
        <h1 className="text-heading font-bold text-ink">Consultant Profile</h1>
      </div>

      {/* Hero */}
      <div className="animate-fade-up rounded-2xl border border-line bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <span className="relative">
            <UserAvatar name={consultant.name} size={80} />
            <span
              aria-hidden
              className="absolute right-0 bottom-1 h-4 w-4 rounded-full border-2 border-card bg-success"
            />
          </span>
          <span className="min-w-0">
            <h2 className="text-subtitle font-bold text-ink">{consultant.name} ✦</h2>
            <p className="text-caption text-muted">{consultant.role}</p>
            <p className="mt-1 text-step font-bold text-warning">
              {stars(consultant.rating)} {consultant.rating}{" "}
              <span className="font-normal text-muted">({consultant.reviewCount} reviews)</span>
            </p>
          </span>
        </div>
      </div>

      {/* About */}
      {consultant.bio ? (
        <section className="rounded-2xl border border-line bg-card p-4 shadow-soft">
          <h3 className="text-subtitle font-medium text-ink">About</h3>
          <p className="mt-1 text-step leading-relaxed text-muted">{consultant.bio}</p>
        </section>
      ) : null}

      {/* Specializes in */}
      {(consultant.tags ?? []).length > 0 ? (
        <section>
          <h3 className="text-subtitle font-medium text-ink">Specializes In</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {consultant.tags!.map((t) => (
              <span key={t} className="rounded-full bg-primary px-3 py-1 text-caption font-semibold text-white">
                {t}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Info tiles — languages / rating / fee (all real fields) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4 text-center shadow-soft">
          <p className="text-caption font-semibold text-muted">Languages</p>
          <p className="mt-1 text-caption text-ink">{(consultant.languages ?? ["English"]).join(", ")}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 text-center shadow-soft">
          <p className="text-caption font-semibold text-muted">Rating</p>
          <p className="mt-1 text-caption font-bold text-warning">★ {consultant.rating}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 text-center shadow-soft">
          <p className="text-caption font-semibold text-muted">Fee</p>
          <p className="mt-1 text-caption text-ink">{consultant.feeRange ?? "On request"}</p>
        </div>
      </div>

      {/* Session type */}
      <section>
        <h3 className="text-subtitle font-medium text-ink">Session Type</h3>
        <div className="mt-2 flex gap-2.5">
          {(["Video", "Audio", "Chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSessionType(t)}
              aria-pressed={sessionType === t}
              className={cn(
                "flex-1 rounded-xl border py-2.5 text-step font-semibold transition-colors",
                sessionType === t
                  ? "border-primary bg-light-purple text-primary"
                  : "border-line bg-card text-muted hover:bg-light-blue",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Pick a date — the real next six days */}
      <section>
        <h3 className="text-subtitle font-medium text-ink">Pick a Date</h3>
        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.value}
              onClick={() => setDate(d.value)}
              aria-pressed={date === d.value}
              className={cn(
                "w-16 shrink-0 rounded-xl border py-3 text-center text-caption font-semibold transition-colors",
                date === d.value ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:bg-light-blue",
              )}
            >
              {d.weekday}
              <span className="block text-step">{d.day}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Available times */}
      <section>
        <h3 className="text-subtitle font-medium text-ink">Available Times</h3>
        <div className="mt-2 grid grid-cols-4 gap-2.5">
          {TIME_SLOTS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTime(t.value)}
              aria-pressed={time === t.value}
              className={cn(
                "rounded-full border py-2 text-caption font-semibold transition-colors",
                time === t.value ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:bg-light-blue",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <Button onClick={() => setBooking(true)}>Book Session</Button>

      {/* Reviews */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-subtitle font-semibold text-ink">Reviews</h3>
          <button
            onClick={() => setWritingReview((w) => !w)}
            className="text-caption font-semibold text-primary hover:underline"
          >
            {writingReview ? "Cancel" : "+ Write a Review"}
          </button>
        </div>

        {writingReview ? (
          <div className="mt-2 rounded-2xl border border-line bg-card p-4 shadow-soft">
            <textarea
              value={reviewDraft}
              onChange={(e) => setReviewDraft(e.target.value)}
              rows={4}
              placeholder="Share your experience..."
              className="w-full resize-y rounded-xl border border-line bg-page px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <Button className="w-auto" onClick={submitReview} disabled={!reviewDraft.trim()}>
                Submit
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-2 space-y-2.5">
          {reviews.map((r, i) => (
            <div key={`${r.name}-${i}`} className="rounded-2xl border border-line bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <UserAvatar name={r.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block text-step font-semibold text-ink">{r.name}</span>
                  <span className="block text-caption text-muted">{r.date}</span>
                </span>
                <span className="text-step font-bold text-warning">{r.stars}</span>
              </div>
              <p className="mt-2 text-step leading-relaxed text-ink">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {booking ? (
        <BookingModal
          consultant={consultant}
          canBook={isAuthenticated && isLive}
          onClose={() => setBooking(false)}
          onBooked={() => {}}
          initialSessionType={sessionType}
          initialDate={date}
          initialTime={time}
        />
      ) : null}
    </div>
  );
}
