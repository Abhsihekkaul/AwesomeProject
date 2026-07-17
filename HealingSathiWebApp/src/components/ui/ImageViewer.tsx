"use client";

import { useEffect } from "react";

/**
 * Fullscreen photo viewer: dark backdrop, the complete image letterboxed,
 * ← back (top-left) and ⬇ download (top-right). Esc or backdrop click closes.
 * Used by chat photos and post carousels.
 */
export default function ImageViewer({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        aria-label="Back"
        onClick={onClose}
        className="absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25"
      >
        ←
      </button>
      <a
        aria-label="Download photo"
        href={src}
        download="healingsathi-photo.jpg"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25"
      >
        ⬇
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element -- data-URI photos */}
      <img
        src={src}
        alt="Full size photo"
        className="max-h-[92vh] max-w-[95vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-6 text-caption font-medium text-white/70">
        Tap anywhere to close · ⬇ saves the photo
      </p>
    </div>
  );
}
