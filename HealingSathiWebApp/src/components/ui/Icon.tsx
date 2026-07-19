import { cn } from "@/lib/cn";

/**
 * The app's tinted icon set, web edition. The PNGs in /public/icons are the
 * SAME assets the RN app ships (src/assets/icons) — a CSS mask colors them
 * with `currentColor`, exactly like React Native's tintColor, so an icon
 * inherits the surrounding text color (muted → primary on active, etc.).
 */
export type IconName =
  | "home" | "people" | "chat" | "staff" | "user2" | "users"
  | "heart" | "help" | "send" | "more" | "search" | "notification"
  | "post" | "star" | "setting" | "upload" | "Video" | "camera"
  | "phone" | "clock" | "shield" | "right-arrow" | "left-arrow"
  | "google" | "language" | "report" | "alert" | "love" | "liked" | "like";

export default function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: size,
        height: size,
        maskImage: `url(/icons/${name}.png)`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(/icons/${name}.png)`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
