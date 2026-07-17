/**
 * Public auth shell: brand on top, one centered card, calm page background.
 * Every /login* and /signup page renders inside this.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <span className="text-3xl font-bold text-primary">HealingSathi</span>
        <p className="mt-1 text-sm text-muted">because healing should never be lonely</p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
