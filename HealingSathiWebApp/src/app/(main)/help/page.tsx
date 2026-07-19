"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import UserAvatar from "@/components/ui/UserAvatar";
import Skeleton from "@/components/ui/Skeleton";
import BookingModal from "@/components/BookingModal";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { DEMO_CONSULTANTS, type Consultant } from "@/lib/consultants";
import { cn } from "@/lib/cn";

type Booking = {
  id: string;
  consultant?: string;
  role?: string;
  sessionType: string;
  date: string;
  time: string;
  status: string;
};

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
        <section className="rounded-2xl border border-line bg-card shadow-soft p-4">
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
            <div key={c.id} className="rounded-2xl border border-line bg-card shadow-soft p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
              <Link href={`/help/${c.id}`} className="flex items-start gap-3">
                <UserAvatar name={c.name} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-step font-bold text-ink">{c.name}</h2>
                  <p className="text-caption text-muted">{c.role}</p>
                  <p className="text-caption font-semibold text-warning">
                    ★ {c.rating} <span className="font-normal text-muted">({c.reviewCount} reviews)</span>
                  </p>
                </div>
                <span className="shrink-0 text-caption font-semibold text-muted">{c.feeRange}</span>
              </Link>
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
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/help/${c.id}`}
                  className="flex flex-1 items-center justify-center rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:border-primary/40 hover:bg-light-purple hover:text-primary"
                >
                  View profile
                </Link>
                <Button className="flex-1" onClick={() => setBookingFor(c)}>
                  Book a Session
                </Button>
              </div>
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
