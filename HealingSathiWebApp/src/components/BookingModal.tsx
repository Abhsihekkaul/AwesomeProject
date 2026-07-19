"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { cn } from "@/lib/cn";
import type { Consultant } from "@/lib/consultants";

export type SessionType = "Video" | "Audio" | "Chat";

/**
 * The app's Booking screen, web edition (shared by /help and /help/[id]):
 * session type + date/time + optional note → POST /bookings.
 * `initial*` lets the consultant profile page pre-fill the picks made there.
 */
export default function BookingModal({
  consultant,
  canBook,
  onClose,
  onBooked,
  initialSessionType,
  initialDate,
  initialTime,
}: {
  consultant: Consultant;
  canBook: boolean;
  onClose: () => void;
  onBooked: () => void;
  initialSessionType?: SessionType;
  initialDate?: string;
  initialTime?: string;
}) {
  const [sessionType, setSessionType] = useState<SessionType>(initialSessionType ?? "Video");
  const [date, setDate] = useState(initialDate ?? "");
  const [time, setTime] = useState(initialTime ?? "");
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
      <div
        className="animate-fade-up w-full max-w-md rounded-t-2xl border border-line bg-card p-5 shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
