import { cn } from "@/lib/cn";

/**
 * The HealingSathi brand lockup: gradient heart tile + wordmark + tagline.
 * Used on the auth screens and the boot splash so the first thing anyone
 * sees looks deliberate, not default.
 */
export default function BrandMark({
  size = "lg",
  className,
}: {
  size?: "lg" | "sm";
  className?: string;
}) {
  const tile = size === "lg" ? "h-16 w-16 rounded-2xl text-3xl" : "h-9 w-9 rounded-xl text-lg";
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25",
          tile,
        )}
      >
        ♥
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
