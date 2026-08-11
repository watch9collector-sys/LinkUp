"use client";

import { useEffect } from "react";
import { GlassCard } from "./components/GlassCard";
import { Button } from "./components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[LinkUp] route error:", error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-10">
      <GlassCard className="space-y-5 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="text-sm leading-relaxed text-white/60">
          Nyvon hit an unexpected error. You can try again or return Home.
        </p>
        {process.env.NODE_ENV !== "production" && error.message ? (
          <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left text-xs text-white/45">
            {error.message}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="primary" size="md" onClick={() => reset()}>
            Try again
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go to Home
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
