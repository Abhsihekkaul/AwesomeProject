import { cn } from "@/lib/cn";

/**
 * The HealingSathi brand lockup: gradient tile with the infinity mark
 * (infinite care) + wordmark + tagline. Used on the auth screens and the
 * boot splash so the first thing anyone sees looks deliberate, not default.
 * The tile breathes at the pace of a calm exhale.
 */
export default function BrandMark({
  size = "lg",
  className,
}: {
  size?: "lg" | "sm";
  className?: string;
}) {
  const tile = size === "lg" ? "h-16 w-16 rounded-2xl text-4xl" : "h-9 w-9 rounded-xl text-xl";
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <span
        aria-hidden
        className={cn(
          "animate-breathe flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark font-bold text-white shadow-lg shadow-primary/25",
          tile,
        )}
      >
        ∞
      </span>
      <span
        className={cn(
          "mt-3 bg-gradient-to-r from-primary to-primary-dark bg-clip-text font-bold text-transparent",
          size === "lg" ? "text-3xl" : "text-lg",
        )}
      >
        HealingSathi
      </span>
      {size === "lg" ? (
        <p className="mt-1 text-sm text-muted">because healing should never be lonely</p>
      ) : null}
    </div>
  );
}
