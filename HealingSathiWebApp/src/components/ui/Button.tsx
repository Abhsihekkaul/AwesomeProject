"use client";

import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

/** The app's PrimaryButton, web edition. Class overrides merge through cn(). */
export default function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "outline" &&
          "border border-line bg-card text-ink hover:bg-light-purple hover:text-primary",
        variant === "ghost" && "text-primary hover:bg-light-purple",
        className,
      )}
      {...props}
    />
  );
}
