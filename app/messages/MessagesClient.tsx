"use client";

import { EmptyState } from "../components/EmptyState";

export function MessagesClient() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Messages
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/65">
          Direct threads with people you connect with — no feeds, no noise.
        </p>
      </header>

      <EmptyState
        title="Inbox is empty"
        description="When you match or join a LinkUp, conversations will land here. Real-time messaging is on the roadmap."
      />
    </div>
  );
}
