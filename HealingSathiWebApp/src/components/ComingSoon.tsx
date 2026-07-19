/** Honest placeholder for surfaces that land in a later build phase. */
export default function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          This surface is scheduled for the <span className="font-semibold text-primary">{phase}</span>{" "}
          build phase (see MainWebsite.md). The API behind it already works — the phone app has it
          today, and the same account will light it up here.
        </p>
      </div>
    </div>
  );
}
