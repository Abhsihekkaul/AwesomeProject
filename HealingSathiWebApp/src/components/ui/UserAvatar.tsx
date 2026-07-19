"use client";

import { cn } from "@/lib/cn";

// Named avatar colors — the backend stores the key; every client maps it to a hue.
// Must stay identical to the app's AVATAR_COLORS (EditProfileScreen).
export const AVATAR_COLORS: { key: string; hex: string }[] = [
  { key: "purple", hex: "#7C6FE8" },
  { key: "blue", hex: "#4A90D9" },
  { key: "green", hex: "#3FA47A" },
  { key: "orange", hex: "#E8955C" },
  { key: "pink", hex: "#D96BA0" },
  { key: "teal", hex: "#3AA6A6" },
];

export const avatarHex = (key?: string | null) =>
  AVATAR_COLORS.find((c) => c.key === key)?.hex;

/**
 * The app's UserAvatar, web edition: photo when there is one, tinted initials
 * circle otherwise — identical colors so identity reads the same on both.
 */
export default function UserAvatar({
  name,
  src,
  color,
  size = 40,
  className,
}: {
  name?: string;
  src?: string | null;
  /** Named avatar-color key (user.avatarColor); tints the initials circle. */
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const hex = avatarHex(color);
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
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        ...(hex ? { backgroundColor: hex, color: "#FFFFFF" } : undefined),
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-light-purple font-bold text-primary",
        className,
      )}
    >
      {initials}
    </span>
  );
}
