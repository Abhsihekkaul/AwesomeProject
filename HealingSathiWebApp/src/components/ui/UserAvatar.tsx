"use client";

import { cn } from "@/lib/cn";

/**
 * The app's UserAvatar, web edition: photo when there is one, tinted initials
 * circle otherwise — identical colors so identity reads the same on both.
 */
export default function UserAvatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- avatars are data-URIs (base64), next/image adds nothing
    <img
      src={src}
      alt={name ?? "avatar"}
      style={{ width: size, height: size }}
      className={cn("rounded-full object-cover", className)}
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-light-purple font-bold text-primary",
        className,
      )}
    >
      {initials}
    </span>
  );
}
