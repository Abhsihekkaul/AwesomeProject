"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Client-side provider stack, mirroring the RN app's App.tsx:
 * Theme → Query (the web twin of useLiveOrDemo's freshness rules) → Auth.
 * ChatNotifications + Call providers join in W3/W5.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Same freshness contract the app's useLiveOrDemo gives every screen:
            // refetch when the surface regains focus, keep data while revalidating.
            refetchOnWindowFocus: true,
            staleTime: 15_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
