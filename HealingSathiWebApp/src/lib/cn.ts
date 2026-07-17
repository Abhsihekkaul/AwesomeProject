import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class merging for shared components. ALWAYS use this (never raw clsx/template
 * strings) when a component accepts className alongside its own variant classes —
 * plain concatenation lets the variant's conflicting Tailwind utility win by CSS
 * cascade order, which is exactly the white-on-white button bug the marketing
 * site hit. tailwind-merge drops the earlier conflicting utility instead.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
