"use client";

import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

/** Labeled input, styled like the app's AppInput. */
export default function Field({ label, className, id, ...props }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none",
          className,
        )}
        {...props}
      />
    </label>
  );
}
