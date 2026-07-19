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
        "inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-b from-primary to-primary-dark text-white shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 hover:brightness-110",
        variant === "outline" &&
          "border border-line bg-card text-ink hover:border-primary/40 hover:bg-light-purple hover:text-primary",
        variant === "ghost" && "text-primary hover:bg-light-purple",
        className,
      )}
      {...props}
    />
  );
}
