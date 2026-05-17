"use client";

import { GlassCard } from "../components/GlassCard";
import { PageLoading } from "../components/ui/LoadingStates";
import { TextLink } from "../components/TextLink";
import { useAuthSession } from "@/src/hooks/useAuthSession";

export default function AdminPage() {
  const { user, ready } = useAuthSession();
  const role =
    typeof (user?.user_metadata as Record<string, unknown> | undefined)?.role ===
    "string"
      ? ((user?.user_metadata as Record<string, unknown>).role as string)
      : "";
  const allowed = role === "admin" || process.env.NODE_ENV === "development";

  if (!ready) return <PageLoading message="Checking access…" />;

  if (!user || !allowed) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <TextLink href="/profile">← Back to app</TextLink>
        <GlassCard className="py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Admin access required
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/58">
            This area is only available to LinkUp admins.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextLink href="/">← Back to app</TextLink>
      </div>
      <GlassCard className="py-10 sm:py-12">
        <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Admin Dashboard: User Reports
        </h1>
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-emerald-500/25 bg-[#0B0F14]/40 px-6 py-14 text-center">
          <p className="text-4xl opacity-90" aria-hidden>
            📋
          </p>
          <p className="mt-4 text-[15px] font-medium text-white/88">
            No reports found
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            When users submit reports, they will appear in this queue.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
