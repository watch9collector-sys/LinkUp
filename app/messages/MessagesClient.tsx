"use client";

import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { PageHeader } from "../components/PageHeader";
import { ButtonLink } from "../components/ui/Button";
import { sectionEyebrowClass } from "../components/ui/styles";

const messageHints = [
  "Join a LinkUp from Explore or the LinkUps tab — that is where real plans start.",
  "Complete your profile so hosts and guests recognize you in attendee lists.",
  "When messaging ships, threads will stay scoped to people you have actually met.",
] as const;

export function MessagesClient() {
  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      <PageHeader
        title="Messages"
        description="Direct threads with people you connect with — no feeds, no noise."
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6">
        <EmptyState
          title="Inbox is empty"
          description="When you match or join a LinkUp, conversations will land here. Real-time messaging is on the roadmap."
          hints={messageHints}
          action={
            <ButtonLink href="/explore" variant="secondary" size="md" fullWidth className="sm:w-auto">
              Browse Explore
            </ButtonLink>
          }
        />

        <aside className="mt-6 hidden lg:mt-0 lg:block">
          <GlassCard className="border-white/[0.06] p-5">
            <h2 className={sectionEyebrowClass}>While you wait</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              LinkUp is intentionally calm: fewer surfaces, clearer intent. Use Explore
              and LinkUps to build the in-person graph messages will eventually sit on
              top of.
            </p>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <ButtonLink href="/linkups" variant="primary" size="sm" fullWidth>
                View LinkUps
              </ButtonLink>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
