"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const t = useT();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Same client-side rules the app enforces on signup.
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, name.trim());
      // New accounts flow through the app's 3-step profile setup first.
      router.replace("/welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">{t("createYourAccount")}</h1>
      <p className="mt-1 text-sm text-muted">
        Find your people — support for your journey starts here.
      </p>

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field
          label={t("name")}
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label={t("email")}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label={t("password")}
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? t("signingUp") : t("signUp")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
