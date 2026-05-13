"use client";

import Link from "next/link";
import { useState } from "react";
import type { LinkUpView } from "@/src/lib/linkupsTypes";
import { formatLinkUpTime } from "@/src/lib/linkupsApi";
import { Button } from "../ui/Button";

type LinkUpCardProps = {
  linkup: LinkUpView;
  signedIn: boolean;
  busy?: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
};

export function LinkUpCard({
  linkup,
  signedIn,
  busy = false,
  onJoin,
  onLeave,
}: LinkUpCardProps) {
  const [showAttendees, setShowAttendees] = useState(false);

  const sortedAttendees = [...linkup.active_attendees].sort((a, b) => {
    if (a.user_id === linkup.host_id) return -1;
    if (b.user_id === linkup.host_id) return 1;
    return a.display_name.localeCompare(b.display_name);
  });

  const statusLabel = linkup.you_host
    ? "Hosting"
    : linkup.you_joined
      ? "Joined"
      : "Open";

  const statusClass =
    linkup.you_host || linkup.you_joined
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/95"
      : "border-white/[0.08] bg-white/[0.04] text-white/55";

  return (
    <article
      className={[
        "rounded-2xl border p-4 transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out sm:p-5",
        "border-white/[0.06] bg-[#111827]/80 ring-1 ring-inset ring-white/[0.03]",
        "focus-within:border-emerald-500/15",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-white/[0.1] motion-safe:hover:bg-[#111827]/92 motion-reduce:hover:translate-y-0",
        linkup.you_joined || linkup.you_host
          ? "shadow-[0_0_0_1px_rgba(34,197,94,0.12)]"
          : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            {linkup.category}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">
            {linkup.title}
          </h3>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
            statusClass,
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm text-white/55">
        <span className="text-white/75">{formatLinkUpTime(linkup.starts_at)}</span>
        <span className="mx-2 text-white/25" aria-hidden>
          ·
        </span>
        <span className="text-emerald-400/85">{linkup.location}</span>
      </p>

      {linkup.description.trim() ? (
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          {linkup.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#0B0F14] text-xs font-semibold text-emerald-300/95">
          {linkup.host_display_name.trim()
            ? linkup.host_display_name.slice(0, 2).toUpperCase()
            : "?"}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-white/40">Host</p>
          <p className="truncate text-sm font-medium text-white/90">
            {linkup.host_display_name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-white/50">
          <span className="tabular-nums">{linkup.attendee_count}</span>
          <span className="text-white/35">going</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAttendees((v) => !v)}
        className="mt-3 w-full rounded-xl py-2 text-left text-xs font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"
        aria-expanded={showAttendees}
      >
        {showAttendees ? "Hide" : "View"} active attendees
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-200 ease-out",
          showAttendees ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <ul className="mt-1 space-y-1.5 rounded-xl border border-white/[0.05] bg-[#0B0F14]/40 px-3 py-2.5">
            {sortedAttendees.length === 0 ? (
              <li className="text-sm text-white/45">No one yet — be the first.</li>
            ) : (
              sortedAttendees.map((a) => (
                <li
                  key={a.user_id}
                  className="flex items-center justify-between gap-2 text-sm text-white/80"
                >
                  <span className="truncate">
                    {a.display_name.trim() || "Member"}
                    {a.user_id === linkup.host_id ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
                        host
                      </span>
                    ) : null}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {linkup.you_host ? (
          <p className="text-xs text-white/45">You are hosting this LinkUp.</p>
        ) : signedIn && linkup.you_joined ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => onLeave(linkup.id)}
          >
            Leave
          </Button>
        ) : signedIn ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={busy}
            onClick={() => onJoin(linkup.id)}
          >
            Join
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex touch-manipulation items-center justify-center rounded-xl border border-white/[0.1] px-3.5 py-2 text-xs font-semibold text-white/80 transition duration-200 hover:bg-white/[0.06] active:translate-y-px"
          >
            Sign in to join
          </Link>
        )}
      </div>
    </article>
  );
}
