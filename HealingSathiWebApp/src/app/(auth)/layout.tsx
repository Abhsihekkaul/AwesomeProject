import BrandMark from "@/components/ui/BrandMark";
import ConnectionArt from "@/components/ui/ConnectionArt";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Public auth shell: soft brand-tinted backdrop, a low-opacity "people
 * bonded together" illustration behind the card, the gradient brand lockup,
 * and a theme toggle that works before signing in.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* calm background glows — decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary opacity-10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-info opacity-10 blur-3xl"
      />
      {/* the bonding illustration, whisper-quiet behind everything */}
      <ConnectionArt className="pointer-events-none absolute top-1/2 left-1/2 w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2 text-primary opacity-[0.08]" />

      <ThemeToggle className="absolute top-4 right-4" />

      <BrandMark className="mb-6" />
      {/* slightly translucent card so the illustration whispers through */}
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-card/90 p-6 shadow-sm backdrop-blur-sm">
        {children}
      </div>
      <p className="mt-6 text-xs text-muted">
        One account, everywhere — this website and the HealingSathi app stay in sync.
      </p>
    </div>
  );
}
