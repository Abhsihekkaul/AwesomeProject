"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import ImageViewer from "@/components/ui/ImageViewer";

/**
 * The app's ImageCarousel, web edition: one photo renders plainly; several get
 * prev/next arrows (visible on hover), position dots and an "n/N" counter.
 */
export default function ImageCarousel({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  if (images.length === 0) return null;

  const go = (delta: number) =>
    setIndex((i) => Math.min(images.length - 1, Math.max(0, i + delta)));

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-light-blue", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- photos are base64 data-URIs */}
      <img
        src={images[index]}
        alt={`photo ${index + 1} of ${images.length}`}
        className="max-h-[480px] w-full cursor-zoom-in object-contain"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setViewerSrc(images[index]);
        }}
      />
      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      {images.length > 1 ? (
        <>
          {index > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous photo"
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ‹
            </button>
          ) : null}
          {index < images.length - 1 ? (
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next photo"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ›
            </button>
          ) : null}
          <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
            {index + 1}/{images.length}
          </span>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-white transition-opacity",
                  i === index ? "opacity-100" : "opacity-50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
