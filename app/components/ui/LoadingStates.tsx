import { Spinner } from "./Spinner";

export function PageLoading({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      className="flex min-h-[32vh] flex-col items-center justify-center gap-3 py-10"
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-9 w-9 text-emerald-400/90" />
      <p className="text-sm text-white/50">{message}</p>
    </div>
  );
}

type FeedGridSkeletonProps = {
  /** Number of placeholder cells (default fills 2×3 desktop grid). */
  count?: number;
};

export function FeedGridSkeleton({ count = 6 }: FeedGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

export function AuthCardSkeleton() {
  return (
    <div
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-white/[0.07] bg-[#111827]/85 p-6 shadow-2xl ring-1 ring-inset ring-white/[0.04] backdrop-blur-xl"
      role="status"
      aria-label="Loading"
    >
      <div className="mx-auto h-3 w-24 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
      <div className="h-8 w-full max-w-[14rem] animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" />
      <div className="mt-6 space-y-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-emerald-500/15 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
