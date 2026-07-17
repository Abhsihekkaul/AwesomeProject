"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { authApi } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";
import { useAuth } from "@/context/AuthContext";

/** Passwordless sign-in: email → 6-digit code → session (same flow as the app). */
export default function EmailCodePage() {
  const router = useRouter();
  const { signInWithEmailCode } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.requestEmailCode(email.trim());
      // Dev builds return the code until SMTP creds are configured.
      setNotice(res.devCode ? `${res.message} (dev code: ${res.devCode})` : res.message);
      setStep("code");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the code"));
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailCode(email.trim(), code.trim());
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in with that code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Sign in with a code</h1>
      <p className="mt-1 text-sm text-muted">
        No password needed — we&apos;ll email you a 6-digit code.
      </p>

      {notice ? <p className="mt-4 text-sm font-medium text-success">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-5 space-y-4">
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-4">
          <Field
            label="6-digit code"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Checking..." : "Sign In"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("email")}>
            Use a different email
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
