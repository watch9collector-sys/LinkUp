"use client";

import { useEffect, useState } from "react";
import { fetchHostedLinkUpHistory, formatLinkUpTime } from "@/src/lib/linkupsApi";
import type { LinkUpView } from "@/src/lib/linkupsTypes";

/** Visible only to the signed-in host. Does not put past events in public discovery. */
export function HostedLinkUpHistory({ userId }: { userId: string }) {
  const [items, setItems] = useState<LinkUpView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchHostedLinkUpHistory(userId).then(({ data, error: fetchError }) => {
      if (!active) return;
      setItems(data);
      setError(fetchError?.message ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <section aria-labelledby="hosted-history-heading" className="space-y-3">
      <div>
        <h2 id="hosted-history-heading" className="text-lg font-semibold text-white">
          Your past hosted LinkUps
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Private host history, separate from public discovery. Showing up to 50 recent events.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-white/55" role="status">Loading your history…</p>
      ) : error ? (
        <p className="text-sm text-amber-200" role="alert">
          Your history could not be loaded. {error}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/55">You do not have any past hosted LinkUps yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <p className="text-[11px] uppercase tracking-wider text-white/40">{item.category} · Past</p>
              <h3 className="mt-1 font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-xs text-white/65">
                {formatLinkUpTime(item.starts_at)} · {item.location}
              </p>
              <p className="mt-2 text-xs text-white/45">
                {item.attendee_count} attendees
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
