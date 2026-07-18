"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, enterDemo } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = () => {
    enterDemo();
    router.replace("/feed");
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to your circles, chats and care.</p>

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link href="/login/forgot" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-3">
        <GoogleSignInButton onError={setError} />
        <Link href="/login/code" className="block">
          <Button variant="outline">Email me a sign-in code</Button>
        </Link>
        <Button variant="ghost" onClick={handleDemo}>
          Try the demo
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
