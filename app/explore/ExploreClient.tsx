"use client";

import Link from "next/link";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { LinkUpCard } from "../components/linkups/LinkUpCard";
import type { MapMeetupMarker } from "../components/MapPlaceholder";
import { MapPlaceholder } from "../components/MapPlaceholder";
import { PageHeader } from "../components/PageHeader";
import { linkUpMarkerPosition } from "@/src/lib/linkupsApi";
import { useLinkUpsFeed } from "@/src/hooks/useLinkUpsFeed";

export function ExploreClient() {
  const { items, loading, error, busyId, join, leave, user, ready } =
    useLinkUpsFeed();

  const markers: MapMeetupMarker[] = items.map((lu) => {
    const pos = linkUpMarkerPosition(lu.id);
    return {
      id: lu.id,
      label: lu.title,
      topPct: pos.topPct,
      leftPct: pos.leftPct,
    };
  });

  const signedIn = Boolean(user);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Explore"
        description="Live LinkUps around you — tap in, join what is happening, show up in the real world."
        action={
          <Link
            href="/linkups"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,197,94,0.28)] ring-1 ring-emerald-300/25 transition hover:from-[#6EE7B7] hover:via-[#34D399] hover:to-[#22C55E]"
          >
            Host a LinkUp
          </Link>
        }
      />

      {!ready || loading ? (
        <p className="text-center text-sm text-white/45">Loading nearby…</p>
      ) : null}

      {error ? (
        <GlassCard className="border-amber-500/15 bg-amber-500/5">
          <p className="text-sm font-medium text-amber-100/95">{error}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Run the migration{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-white/80">
              supabase/migrations/20260212160000_linkups_schema.sql
            </code>{" "}
            in the Supabase SQL editor for this project, then run{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">npm run verify:supabase</code> locally.
            Restart <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">npm run dev</code> after changing{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.local</code>.
          </p>
        </GlassCard>
      ) : null}

      <MapPlaceholder markers={markers} />

      {ready && !loading && items.length === 0 && !error ? (
        <EmptyState
          title="Nothing scheduled yet"
          description="When people publish LinkUps, they show up here and on the map — check back soon or host one from the LinkUps tab."
        />
      ) : null}

      {items.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/40">
            Nearby LinkUps
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((lu) => (
              <LinkUpCard
                key={lu.id}
                linkup={lu}
                signedIn={signedIn}
                busy={busyId === lu.id}
                onJoin={join}
                onLeave={leave}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!signedIn ? (
        <p className="text-center text-xs text-white/40">
          <Link href="/" className="text-emerald-400/90 underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to join a LinkUp.
        </p>
      ) : null}
    </div>
  );
}
