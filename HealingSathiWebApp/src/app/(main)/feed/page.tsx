"use client";

import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";

/**
 * W1 placeholder: proves the session end-to-end (the name/email here come from
 * the real backend via /auth/me). The live feed, composer and PostCards land
 * in W2 — this page is their mount point.
 */
export default function FeedPage() {
  const { user, isDemo } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Composer strip (functional in W2) */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
        <UserAvatar name={user?.name ?? "Demo"} src={user?.avatarUrl} size={40} />
        <div className="flex-1 rounded-full bg-light-blue px-4 py-2.5 text-sm text-muted">
          What&apos;s on your mind{user?.name ? `, ${user.name.split(" ")[0]}` : ""}?
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        {user ? (
          <>
            <h1 className="text-lg font-bold text-ink">
              Signed in as {user.name} <span className="text-muted">({user.email})</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              That name came from the live backend — your phone and this browser now share one
              account. The real feed (your posts, your sathis&apos;, your groups&apos; and your
              condition community&apos;s) arrives in the W2 build phase.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-ink">Demo mode</h1>
            <p className="mt-2 text-sm text-muted">
              You&apos;re exploring without an account — same contract as the app&apos;s &quot;Try
              the demo&quot;. Demo posts render here in W2; sign in any time for your real circles.
            </p>
          </>
        )}
      </div>

      {isDemo ? (
        <p className="text-center text-xs text-muted">
          Demo mode · nothing here is saved · create an account when you&apos;re ready
        </p>
      ) : null}
    </div>
  );
}
