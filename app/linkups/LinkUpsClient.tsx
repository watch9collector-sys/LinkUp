"use client";

import { useCallback, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { CreateLinkUpModal } from "../components/linkups/CreateLinkUpModal";
import { LinkUpCard } from "../components/linkups/LinkUpCard";
import { LinkUpDetailsModal } from "../components/linkups/LinkUpDetailsModal";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { FeedGridSkeleton } from "../components/ui/LoadingStates";
import { sectionEyebrowClass } from "../components/ui/styles";
import { TextLink } from "../components/TextLink";
import { useLinkUpsFeed } from "@/src/hooks/useLinkUpsFeed";

const hostEmptyHints = [
  "Pick a title people can scan in one second (for example, “Sunset walk — Marina”).",
  "Choose a time you would actually show up for — clarity builds trust.",
  "Use a neighborhood or landmark for location so guests know where to head.",
] as const;

const guestEmptyHints = [
  "Sign in from Home to create a LinkUp or join one in a single tap.",
  "Explore shows the same plans on a map — useful when you are deciding what is near you.",
] as const;

function HostingTipsAside() {
  return (
    <aside className="hidden lg:block">
      <GlassCard className="border-white/[0.06] p-5">
        <h2 className={sectionEyebrowClass}>Hosting tips</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/58">
          <li className="flex gap-2">
            <span className="text-emerald-400/80" aria-hidden>
              ·
            </span>
            <span>Keep the description short: what to bring, how long you will stay, and how to find the group.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400/80" aria-hidden>
              ·
            </span>
            <span>Update the time if plans shift — attendees see changes in real time.</span>
          </li>
        </ul>
      </GlassCard>
    </aside>
  );
}

export function LinkUpsClient() {
  const { items, loading, error, busyId, join, leave, user, ready, refresh } =
    useLinkUpsFeed();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const signedIn = Boolean(user);
  const selectedLinkUp = items.find((item) => item.id === detailsId) ?? null;

  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      <PageHeader
        title="LinkUps"
        description="Create a meetup with a clear time and place. Others can join in one tap — no feed, just real plans."
        action={
          signedIn ? (
            <Button type="button" variant="primary" size="md" onClick={openModal}>
              New LinkUp
            </Button>
          ) : null
        }
      />

      {!signedIn && ready ? (
        <GlassCard className="border-white/[0.06] py-4 text-center sm:py-5 sm:text-left">
          <p className="text-sm leading-relaxed text-white/70">
            Sign in to host or join LinkUps.{" "}
            <TextLink href="/">Go to Home →</TextLink>
          </p>
        </GlassCard>
      ) : null}

      {!ready || loading ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <FeedGridSkeleton count={6} />
        </div>
      ) : null}

      {error ? (
        <GlassCard className="border-amber-500/15 bg-amber-500/5">
          <p className="text-sm font-medium text-amber-100/95">{error}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Run{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-white/80">
              supabase/migrations/20260212160000_linkups_schema.sql
            </code>{" "}
            in the Supabase SQL editor, then{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">npm run verify:supabase</code> locally. Restart{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">npm run dev</code> after env changes.
          </p>
        </GlassCard>
      ) : null}

      {ready && !loading && items.length === 0 && !error ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
          <EmptyState
            title="No LinkUps yet"
            description="Be the first to put something on the calendar. Add a title, category, time, and place — people join when they are ready to show up."
            hints={signedIn ? hostEmptyHints : guestEmptyHints}
            action={
              signedIn ? (
                <Button type="button" variant="primary" size="lg" onClick={openModal}>
                  Create a LinkUp
                </Button>
              ) : null
            }
          />
          {signedIn ? <HostingTipsAside /> : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((lu) => (
            <LinkUpCard
              key={lu.id}
              linkup={lu}
              signedIn={signedIn}
              busy={busyId === lu.id}
              onJoin={join}
              onLeave={leave}
              onDetails={setDetailsId}
            />
          ))}
        </div>
      ) : null}

      {user ? (
        <CreateLinkUpModal
          open={modalOpen}
          onClose={closeModal}
          user={user}
          onCreated={() => {
            void refresh();
          }}
        />
      ) : null}
      <LinkUpDetailsModal
        open={Boolean(selectedLinkUp)}
        linkup={selectedLinkUp}
        signedIn={signedIn}
        busy={selectedLinkUp ? busyId === selectedLinkUp.id : false}
        onClose={() => setDetailsId(null)}
        onJoin={join}
        onLeave={leave}
      />
    </div>
  );
}
