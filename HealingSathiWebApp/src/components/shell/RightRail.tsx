"use client";

/**
 * Desktop right rail: My Sathis + My Groups + condition-based suggestions.
 * Goes live in W4 (people & groups) — until then it explains itself honestly,
 * the same way the app treats unfinished surfaces.
 */
export default function RightRail() {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-sm font-bold text-ink">My Sathis</h2>
        <p className="mt-2 text-xs text-muted">
          Your people appear here — live in the W4 build phase.
        </p>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-sm font-bold text-ink">My Groups</h2>
        <p className="mt-2 text-xs text-muted">
          Joined circles land here — live in the W4 build phase.
        </p>
      </section>
    </aside>
  );
}
