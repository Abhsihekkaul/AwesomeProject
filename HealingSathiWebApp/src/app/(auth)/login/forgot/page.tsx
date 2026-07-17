"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { authApi } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";

/** Forgot password: email → code → new password (same flow as the app). */
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setNotice(res.devCode ? `${res.message} (dev code: ${res.devCode})` : res.message);
      setStep("reset");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the code"));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      router.replace("/login");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't reset the password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll email a code; use it to set a new password. Every device gets signed out.
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
        <form onSubmit={reset} className="mt-5 space-y-4">
          <Field
            label="6-digit code"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Resetting..." : "Set New Password"}
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
