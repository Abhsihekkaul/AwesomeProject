"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { GOOGLE_WEB_CLIENT_ID } from "@/api/config";

const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

/** Resolves once the GIS script is on the page (loads it on first call). */
let gsiPromise: Promise<GoogleId | null> | null = null;
const loadGsi = (): Promise<GoogleId | null> => {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve) => {
    const done = () => resolve(window.google?.accounts?.id ?? null);
    if (window.google?.accounts?.id) return done();
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = done;
    script.onerror = () => resolve(null); // offline / blocked — fall back to the explainer
    document.head.appendChild(script);
  });
  return gsiPromise;
};

/**
 * "Continue with Google" — the real thing. When the web OAuth client id exists
 * (NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID, see GoogleSignInSetup.md) this renders the
 * official Google Identity Services button; its id-token credential goes through
 * the same POST /auth/google the app uses, so one Google account = one
 * HealingSathi account everywhere. Without the id it stays the honest explainer
 * button, same pattern as the app.
 */
export default function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const { resolvedTheme } = useTheme();
  const slotRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) return;
    let cancelled = false;
    loadGsi().then((gsi) => {
      const slot = slotRef.current;
      if (cancelled || !gsi || !slot) return;
      gsi.initialize({
        client_id: GOOGLE_WEB_CLIENT_ID,
        callback: async ({ credential }) => {
          setSigningIn(true);
          try {
            await signInWithGoogle(credential);
            router.replace("/feed");
          } catch (err) {
            setSigningIn(false);
            onError(err instanceof Error ? err.message : "Google sign-in failed");
          }
        },
      });
      slot.innerHTML = ""; // re-render (theme change) replaces, never stacks
      gsi.renderButton(slot, {
        theme: resolvedTheme === "dark" ? "filled_black" : "outline",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width: Math.min(slot.clientWidth || 400, 400),
      });
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedTheme, signInWithGoogle, router, onError]);

  if (!GOOGLE_WEB_CLIENT_ID) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          onError("Google sign-in needs the web OAuth client id first — see GoogleSignInSetup.md.")
        }
      >
        Continue with Google
      </Button>
    );
  }

  return (
    <div className="relative">
      {/* GIS iframe button mounts here; explainer shows until it does */}
      <div ref={slotRef} className={ready ? "flex justify-center" : "hidden"} aria-busy={signingIn} />
      {!ready ? (
        <Button variant="outline" disabled>
          Continue with Google
        </Button>
      ) : null}
      {signingIn ? (
        <p className="mt-2 text-center text-xs font-medium text-muted">Signing you in…</p>
      ) : null}
    </div>
  );
}
