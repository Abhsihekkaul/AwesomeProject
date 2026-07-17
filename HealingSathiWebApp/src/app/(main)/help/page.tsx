"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import UserAvatar from "@/components/ui/UserAvatar";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { cn } from "@/lib/cn";

type Consultant = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  tags?: string[];
  languages?: string[];
  feeRange?: string;
};

type Booking = {
  id: string;
  consultant?: string;
  role?: string;
  sessionType: string;
  date: string;
  time: string;
  status: string;
};

const DEMO_CONSULTANTS: Consultant[] = [
  { id: "c1", name: "Dr. Sarah Chen", role: "Clinical Psychologist", rating: 4.9, reviewCount: 128, tags: ["Anxiety", "Chronic Illness"], feeRange: "$80–120/session", bio: "Specializes in chronic-illness adjustment and anxiety." },
  { id: "c2", name: "Dr. Priya Patel", role: "Pain Psychologist", rating: 4.8, reviewCount: 96, tags: ["Chronic Pain", "CBT"], feeRange: "$90–130/session", bio: "CBT for persistent pain and pacing." },
];

/** Psychological Help (the app's tab): consultant directory, booking, applications. */
export default function HelpPage() {
  const { isAuthenticated } = useAuth();
  const [bookingFor, setBookingFor] = useState<Consultant | null>(null);

  const { data: consultants, isLive, loading } = useLiveData<Consultant[]>(
    ["consultants"],
    async () => resourcesApi.getConsultants(),
    DEMO_CONSULTANTS,
  );
  const { data: bookings, refresh: refreshBookings } = useLiveData<Booking[]>(
    ["bookings"],
    async () => resourcesApi.getMyBookings(),
    [],
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading font-bold text-ink">Psychological Help</h1>
        <Link href="/help/apply" className="text-step font-semibold text-primary hover:underline">
          Join as a consultant →
        </Link>
      </div>
      <p className="text-step text-muted">Licensed professionals who understand chronic conditions.</p>

      {bookings.length > 0 ? (
        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-caption font-bold tracking-wide text-muted uppercase">My bookings</h2>
          <div className="mt-2 space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-step">
                <span className="text-ink">
                  <span className="font-semibold">{b.consultant}</span> · {b.sessionType} · {b.date} at {b.time}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-caption font-semibold",
                    b.status === "confirmed" ? "bg-light-green text-success" : "bg-light-blue text-muted",
                  )}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {loading
        ? [0, 1].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)
        : consultants.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-start gap-3">
                <UserAvatar name={c.name} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-step font-bold text-ink">{c.name}</h2>
                  <p className="text-caption text-muted">{c.role}</p>
                  <p className="text-caption font-semibold text-warning">
                    ★ {c.rating} <span className="font-normal text-muted">({c.reviewCount} reviews)</span>
                  </p>
                </div>
                <span className="shrink-0 text-caption font-semibold text-muted">{c.feeRange}</span>
              </div>
              {c.bio ? <p className="mt-2 text-step leading-snug text-muted">{c.bio}</p> : null}
              {(c.tags ?? []).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tags!.map((t) => (
                    <span key={t} className="rounded-full bg-light-purple px-2.5 py-0.5 text-caption font-semibold text-primary">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <Button className="mt-3" onClick={() => setBookingFor(c)}>
                Book a Session
              </Button>
            </div>
          ))}
      {!isLive && !loading ? (
        <p className="text-center text-caption text-muted">Demo consultants — sign in to book for real.</p>
      ) : null}

      {bookingFor ? (
        <BookingModal
          consultant={bookingFor}
          canBook={isAuthenticated && isLive}
          onClose={() => setBookingFor(null)}
          onBooked={refreshBookings}
        />
      ) : null}
    </div>
  );
}

function BookingModal({
  consultant,
  canBook,
  onClose,
  onBooked,
}: {
  consultant: Consultant;
  canBook: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [sessionType, setSessionType] = useState<"Video" | "Audio" | "Chat">("Video");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!date || !time) {
      setError("Pick a date and time");
      return;
    }
    if (!canBook) {
      setError("Demo mode can't book — sign in first");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await resourcesApi.createBooking({
        consultantId: consultant.id,
        sessionType,
        date,
        time,
        note: note.trim() || undefined,
      });
      setDone(true);
      onBooked();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't book the session"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl border border-line bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <h2 className="text-heading font-bold text-ink">Booked ✓</h2>
            <p className="mt-2 text-step text-muted">
              Your {sessionType.toLowerCase()} session with {consultant.name} is set for {date} at {time}.
            </p>
            <Button className="mt-4" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <h2 className="text-heading font-bold text-ink">Book {consultant.name}</h2>
            {error ? <p className="mt-2 text-step font-medium text-danger">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              {(["Video", "Audio", "Chat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionType(t)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-step font-semibold",
                    sessionType === t ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 rounded-xl border border-line bg-light-blue px-3 py-2.5 text-step text-ink focus:border-primary focus:outline-none" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 rounded-xl border border-line bg-light-blue px-3 py-2.5 text-step text-ink focus:border-primary focus:outline-none" />
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Anything they should know beforehand? (optional)"
              className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <Button className="mt-4" onClick={submit} disabled={busy}>
              {busy ? "Booking..." : "Confirm Booking"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
