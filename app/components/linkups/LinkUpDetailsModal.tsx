"use client";

import Link from "next/link";
import { useState } from "react";
import type { LinkUpView } from "@/src/lib/linkupsTypes";
import { formatLinkUpTime } from "@/src/lib/linkupsApi";
import { Avatar } from "../Avatar";
import { Modal } from "../Modal";
import { Button, buttonClasses } from "../ui/Button";

type LinkUpDetailsModalProps = {
  linkup: LinkUpView | null;
  open: boolean;
  signedIn: boolean;
  busy?: boolean;
  onClose: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onDelete?: (id: string) => Promise<{ ok: boolean; error: string | null }>;
};

export function LinkUpDetailsModal({
  linkup,
  open,
  signedIn,
  busy = false,
  onClose,
  onJoin,
  onLeave,
  onDelete,
}: LinkUpDetailsModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!linkup) return null;

  const hasMapPin =
    linkup.latitude !== null &&
    linkup.longitude !== null &&
    Number.isFinite(linkup.latitude) &&
    Number.isFinite(linkup.longitude);

  async function handleDelete() {
    if (!onDelete || !linkup) return;
    setDeleteError(null);
    const result = await onDelete(linkup.id);
    if (result.ok) {
      setConfirmDelete(false);
      onClose();
      return;
    }
    setDeleteError(result.error);
  }

  return (
    <Modal open={open} title="LinkUp details" size="lg" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            {linkup.category}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white text-balance">
            {linkup.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/58">
            {formatLinkUpTime(linkup.starts_at)}
            <span className="mx-2 text-white/25" aria-hidden>
              ·
            </span>
            <span className="text-emerald-300/90">{linkup.location}</span>
          </p>
          {!hasMapPin ? (
            <p className="mt-2 text-xs text-amber-200/80">
              Map pin unavailable — location was not geocoded. Hosts can delete and
              recreate with a clearer address.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-[#0B0F14]/40 p-3.5">
          <Avatar label={linkup.host_display_name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40">Host</p>
            <p className="truncate text-sm font-medium text-white/90">
              {linkup.host_display_name}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/8 px-3 py-2 text-right ring-1 ring-emerald-500/12">
            <p className="text-lg font-semibold leading-none text-emerald-200 tabular-nums">
              {linkup.attendee_count}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-emerald-200/55">
              going
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
            What to expect
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/68">
            {linkup.description.trim() ||
              "No description yet. Check the title, time, and host details before joining."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
            Active attendees
          </h3>
          {linkup.active_attendees.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {linkup.active_attendees.slice(0, 8).map((attendee) => (
                <li
                  key={attendee.user_id}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75"
                >
                  {attendee.display_name.trim() || "Member"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/45">
              No attendees yet. Be the first to join.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
          {linkup.you_host ? (
            confirmDelete ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <p className="text-xs text-red-200/90">
                  Delete this LinkUp permanently? Attendees will lose access.
                </p>
                {deleteError ? (
                  <p className="text-xs text-red-300/95" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    loading={busy}
                    onClick={() => void handleDelete()}
                  >
                    Confirm delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    disabled={busy}
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="md"
                disabled={busy || !onDelete}
                onClick={() => setConfirmDelete(true)}
              >
                Delete LinkUp
              </Button>
            )
          ) : signedIn && linkup.you_joined ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={busy}
              onClick={() => onLeave(linkup.id)}
            >
              Leave LinkUp
            </Button>
          ) : signedIn ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={busy}
              onClick={() => onJoin(linkup.id)}
            >
              Join LinkUp
            </Button>
          ) : (
            <Link
              href="/"
              className={[
                buttonClasses("primary", "md"),
                "inline-flex justify-center",
              ].join(" ")}
            >
              Sign in to join
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
