import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthRecoveryRedirect } from "./components/AuthRecoveryRedirect";
import { Navbar } from "./components/Navbar";
import { RECOVERY_REDIRECT_SCRIPT } from "@/src/lib/authRecovery";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LinkUp",
    template: "%s · LinkUp",
  },
  description:
    "Real-time, location-based meetups — discover nearby LinkUps and show up in the real world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-clip antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col bg-[#0B0F14] font-sans antialiased overflow-x-clip">
        <Script id="linkup-recovery-redirect" strategy="beforeInteractive">
          {RECOVERY_REDIRECT_SCRIPT}
        </Script>
        <AuthRecoveryRedirect />
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 pt-5 sm:px-5 md:py-8 md:pb-10 md:pt-6 lg:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
