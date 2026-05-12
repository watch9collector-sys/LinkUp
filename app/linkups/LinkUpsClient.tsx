"use client";

import { useCallback, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { CreateLinkUpModal } from "../components/linkups/CreateLinkUpModal";
import { LinkUpCard } from "../components/linkups/LinkUpCard";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { TextLink } from "../components/TextLink";
import { useLinkUpsFeed } from "@/src/hooks/useLinkUpsFeed";

export function LinkUpsClient() {
  const { items, loading, error, busyId, join, leave, user, ready, refresh } =
    useLinkUpsFeed();
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const signedIn = Boolean(user);

  return (
    <div className="space-y-6 sm:space-y-8">
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
        <GlassCard className="border-white/[0.06] py-5 text-center sm:text-left">
          <p className="text-sm text-white/70">
            Sign in to host or join LinkUps.{" "}
            <TextLink href="/">Go to Home →</TextLink>
          </p>
        </GlassCard>
      ) : null}

      {!ready || loading ? (
        <p className="text-center text-sm text-white/45">Loading…</p>
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
        <EmptyState
          title="No LinkUps yet"
          description="Be the first to put something on the calendar. Add a title, category, time, and place — people join when they are ready to show up."
          action={
            signedIn ? (
              <Button type="button" variant="primary" size="lg" onClick={openModal}>
                Create a LinkUp
              </Button>
            ) : null
          }
        />
      ) : null}

      {items.length > 0 ? (
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
    </div>
  );
}
