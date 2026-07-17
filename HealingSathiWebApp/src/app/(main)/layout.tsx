"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/shell/TopBar";
import LeftNav from "@/components/shell/LeftNav";
import RightRail from "@/components/shell/RightRail";
import BottomTabs from "@/components/shell/BottomTabs";
import ChatToast from "@/components/ChatToast";
import CallOverlay from "@/components/CallOverlay";
import { useAuth } from "@/context/AuthContext";

/**
 * The signed-in shell (Facebook-shaped): sticky top bar, left nav, scrolling
 * center, right rail. Route guard lives here — no session and no demo flag
 * means /login. Demo mode renders the shell with dummy data (same contract
 * as the app's "Try the Demo").
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isDemo, isBootstrapping } = useAuth();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated && !isDemo) router.replace("/login");
  }, [isAuthenticated, isDemo, isBootstrapping, router]);

  if (isBootstrapping || (!isAuthenticated && !isDemo)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-2xl font-bold text-primary">HealingSathi</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      {/* message toasts + calls render above the whole shell — any page */}
      <ChatToast />
      <CallOverlay />
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <div className="hidden lg:block">
          <div className="sticky top-14">
            <LeftNav />
          </div>
        </div>
        {/* pb clears the mobile bottom tab bar; desktop doesn't have one */}
        <main className="min-h-[calc(100vh-3.5rem)] px-4 py-5 pb-24 lg:pb-5">{children}</main>
        <div className="hidden xl:block">
          <div className="sticky top-14">
            <RightRail />
          </div>
        </div>
      </div>
      <BottomTabs />
    </div>
  );
}
