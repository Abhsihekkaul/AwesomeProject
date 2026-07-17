"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Front door: signed in (or in demo mode) → the feed; otherwise → login. */
export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isDemo, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    router.replace(isAuthenticated || isDemo ? "/feed" : "/login");
  }, [isAuthenticated, isDemo, isBootstrapping, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <span className="text-2xl font-bold text-primary">HealingSathi</span>
    </div>
  );
}
