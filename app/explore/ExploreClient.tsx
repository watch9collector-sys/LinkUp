"use client";

import Link from "next/link";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { LinkUpCard } from "../components/linkups/LinkUpCard";
import type { MapMeetupMarker } from "../components/MapPlaceholder";
import {
  MapPlaceholder,
  MapPlaceholderSkeleton,
} from "../components/MapPlaceholder";
import { PageHeader } from "../components/PageHeader";
import { ButtonLink } from "../components/ui/Button";
import { sectionEyebrowClass } from "../components/ui/styles";
import { linkUpMarkerPosition } from "@/src/lib/linkupsApi";
import { useLinkUpsFeed } from "@/src/hooks/useLinkUpsFeed";

const exploreEmptyHints = [
  "Open the LinkUps tab and tap New LinkUp to put something on the map.",
  "Sign in from Home so you can join with one tap when you find a plan you like.",
  "Check back later — new meetups can appear any time.",
] as const;

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
  const showSkeleton = !ready || loading;
  const showMap = ready && !loading;

  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      <PageHeader
        title="Explore"
        description="Live LinkUps around you — tap in, join what is happening, show up in the real world."
        action={
          <ButtonLink href="/linkups" variant="primary" size="md">
            Host a LinkUp
          </ButtonLink>
        }
      />

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

      {showSkeleton ? <MapPlaceholderSkeleton /> : null}
      {showMap ? <MapPlaceholder markers={markers} /> : null}

      {ready && !loading && items.length === 0 && !error ? (
        <EmptyState
          title="Nothing scheduled yet"
          description="When people publish LinkUps, they show up here and on the map — check back soon or host one from the LinkUps tab."
          hints={exploreEmptyHints}
        />
      ) : null}

      {items.length > 0 ? (
        <section className="space-y-3 lg:space-y-4">
          <h2 className={sectionEyebrowClass}>Nearby LinkUps</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <Link
            href="/"
            className="rounded-md text-emerald-400/90 underline-offset-2 outline-none transition-colors hover:text-emerald-300 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
          >
            Sign in
          </Link>{" "}
          to join a LinkUp.
        </p>
      ) : null}
    </div>
  );
}
