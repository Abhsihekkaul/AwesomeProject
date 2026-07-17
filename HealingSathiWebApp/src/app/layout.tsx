import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "HealingSathi",
  description:
    "Because healing should never be lonely — your circles, chats and care, now on the web.",
};

// viewport-fit=cover lets the mobile bottom tab bar pad itself around the
// home indicator (env(safe-area-inset-bottom)) on notched phones.
export const viewport = {
  themeColor: "#7453C8",
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes stamps the .dark class on <html>
    // before hydration, which React would otherwise flag as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
