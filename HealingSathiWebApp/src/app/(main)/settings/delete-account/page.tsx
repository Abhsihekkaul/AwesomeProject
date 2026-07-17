"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";
import { cn } from "@/lib/cn";

// Same preset exit reasons the app offers — stored anonymously server-side.
const EXIT_REASONS = [
  "I got the support I needed",
  "Couldn't find people like me",
  "Privacy concerns",
  "Too many notifications",
  "The app was confusing or buggy",
  "Something else",
];

/** The app's DeleteAccountScreen: reason + optional feedback + password → erase. */
export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [reason, setReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    if (!reason) {
      setError("Please tell us why you're leaving — pick the closest option");
      return;
    }
    if (!password) {
      setError("Enter your password to confirm it's you");
      return;
    }
    if (!window.confirm("Delete forever? This permanently erases your profile, posts, comments and messages. There is no way back.")) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await authApi.deleteAccount(password, reason, feedback.trim() || undefined);
      await signOut();
      window.alert("Your account and all its content have been erased. Take care. 💜");
      router.replace("/login");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete the account"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-heading font-bold text-ink">Delete account</h1>

      <div className="rounded-2xl border border-danger bg-card p-5">
        <h2 className="text-body font-bold text-danger">This cannot be undone</h2>
        <p className="mt-2 text-step leading-relaxed text-muted">
          Deleting {user?.email ? `the account for ${user.email}` : "your account"} permanently
          erases your profile, every post and comment you wrote, your reactions, your conversations
          (for both sides), sathi connections and group memberships. All devices — including the
          app on your phone — are signed out immediately.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-step font-semibold text-ink">Why are you leaving?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXIT_REASONS.map((option) => (
            <button
              key={option}
              onClick={() => setReason(option)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-caption font-semibold",
                reason === option ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-step font-semibold text-ink">Anything we could have done better?</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Optional — your words reach the team anonymously and help us improve."
          className="mt-2 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />

        {error ? <p className="mt-3 text-step font-medium text-danger">{error}</p> : null}

        <div className="mt-4">
          <Field
            label="Your password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          onClick={confirmDelete}
          disabled={busy}
          className="mt-4 bg-danger hover:bg-danger/80"
        >
          {busy ? "Deleting..." : "Delete My Account Forever"}
        </Button>
      </div>
    </div>
  );
}
