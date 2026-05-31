"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[LinkUp] global error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 font-sans text-white antialiased">
        <div className="w-full max-w-lg rounded-2xl border border-white/[0.07] bg-[#111827]/85 p-8 text-center shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)]">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            LinkUp could not load this page. Try again or return Home.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl bg-[#0F172A]/90 px-5 py-2.5 text-sm font-semibold text-white/95 ring-1 ring-white/[0.08]"
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
