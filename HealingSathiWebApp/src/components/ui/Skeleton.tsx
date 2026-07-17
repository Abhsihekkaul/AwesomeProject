import { cn } from "@/lib/cn";

/**
 * Shimmer skeleton — a soft block with a light sweep moving across it, so
 * loading reads as "content on its way" instead of an empty page. Use shaped
 * compositions (SkeletonPostCard, chat rows) rather than bare rectangles.
 */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-light-blue", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />
    </div>
  );
}

/** A PostCard-shaped shimmer: avatar + name lines, text lines, an image block. */
export function SkeletonPostCard() {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-4 h-44 w-full rounded-2xl" />
    </div>
  );
}

/** A chat-list-row shimmer. */
export function SkeletonChatRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
