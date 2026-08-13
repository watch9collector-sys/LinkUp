"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "../GlassCard";
import { Button } from "../ui/Button";
import { sectionEyebrowClass } from "../ui/styles";
import {
  fetchMyBlocks,
  unblockUser,
  type UserBlockRow,
} from "@/src/lib/moderationApi";

export function BlockedUsersPanel() {
  const [rows, setRows] = useState<UserBlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchMyBlocks();
    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function handleUnblock(blockedId: string) {
    setBusyId(blockedId);
    setError(null);
    try {
      const { error: unblockError } = await unblockUser(blockedId);
      if (unblockError) {
        setError(unblockError.message);
        return;
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <GlassCard className="border-white/[0.06] p-6 sm:p-7">
      <h2 className={sectionEyebrowClass}>Blocked accounts</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Blocking is private. People you block cannot join your LinkUps or
        interact with you through the app.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-white/45">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/45">You have not blocked anyone.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#0B0F14]/30">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <span className="truncate font-mono text-xs text-white/70">
                {row.blocked_id.slice(0, 8)}…
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={busyId === row.blocked_id}
                onClick={() => void handleUnblock(row.blocked_id)}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p className="mt-3 text-sm text-red-300/95" role="alert">
          {error}
        </p>
      ) : null}
    </GlassCard>
  );
}
