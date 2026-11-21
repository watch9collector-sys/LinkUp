"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteLinkUpAsHost,
  fetchLinkUps,
  joinLinkUp,
  leaveLinkUp,
  toLinkUpView,
} from "@/src/lib/linkupsApi";
import type { LinkUpRow, LinkUpView } from "@/src/lib/linkupsTypes";
import type { LinkUpsCursor } from "@/src/lib/linkupsApi";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { polishLinkUpForDisplay } from "@/src/lib/investorDisplay";
import { fetchBlockedEitherWayIds } from "@/src/lib/moderationApi";
import { getDisplayName } from "@/src/lib/userDisplay";
import { captureAnalytics } from "@/src/lib/analytics";

// Private table changes are not broadcast: signed-in and guest clients
// refresh via the access-controlled fetch_safe_linkups API instead.
const FEED_POLL_INTERVAL_MS = 30_000;

export function useLinkUpsFeed() {
  const { user, ready } = useAuthSession();
  const [items, setItems] = useState<LinkUpView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<LinkUpsCursor | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchGenerationRef = useRef(0);

  const prepareRows = useCallback(
    async (rows: LinkUpRow[]) => {
      const blockedIds = user
        ? await fetchBlockedEitherWayIds()
        : new Set<string>();

      return rows
        .map((row) => polishLinkUpForDisplay(toLinkUpView(row, user?.id)))
        .filter((item) => {
          if (!user?.id) return true;
          if (item.host_id === user.id) return true;
          return !blockedIds.has(item.host_id);
        });
    },
    [user],
  );

  const runFetch = useCallback(
    async (showSpinner: boolean) => {
      const generation = ++fetchGenerationRef.current;
      setLoadingMore(false);

      if (showSpinner) {
        setLoading(true);
        setError(null);
      }

      const {
        data,
        error: fetchError,
        nextCursor: fetchedNextCursor,
      } = await fetchLinkUps();

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setItems([]);
        setNextCursor(null);
      } else {
        setError(null);
        const prepared = await prepareRows(data);
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        setItems(prepared);
        setNextCursor(fetchedNextCursor);
      }

      if (showSpinner) {
        setLoading(false);
      }
    },
    [prepareRows],
  );

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      void runFetch(true);
    }, 0);
    return () => clearTimeout(id);
  }, [ready, runFetch]);

  useEffect(() => {
    if (!ready) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void runFetch(false);
      }
    };
    // Low-frequency refresh retains LinkUp updates without exposing private
    // database changes over unauthenticated Realtime channels.
    const interval = window.setInterval(refreshWhenVisible, FEED_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      fetchGenerationRef.current += 1;
    };
  }, [ready, runFetch]);

  const join = useCallback(
    async (linkupId: string) => {
      if (!user) return;
      const event = items.find((item) => item.id === linkupId);
      if (!event || Date.parse(event.starts_at) <= Date.now()) {
        setError("This LinkUp is no longer available to join.");
        return;
      }
      setBusyId(linkupId);
      setError(null);
      try {
        const { error: joinError } = await joinLinkUp(
          linkupId,
          user.id,
          getDisplayName(user),
        );
        if (joinError) {
          setError(joinError.message);
        } else {
          captureAnalytics("linkup_joined", user.id, { linkup_id: linkupId });
        }
        await runFetch(false);
      } finally {
        setBusyId(null);
      }
    },
    [user, items, runFetch],
  );

  const leave = useCallback(
    async (linkupId: string) => {
      if (!user) return;
      const linkup = items.find((item) => item.id === linkupId);
      if (linkup?.you_host) {
        return;
      }
      setBusyId(linkupId);
      setError(null);
      try {
        const { error: leaveError } = await leaveLinkUp(linkupId, user.id);
        if (leaveError) {
          setError(leaveError.message);
        } else {
          captureAnalytics("linkup_left", user.id, { linkup_id: linkupId });
        }
        await runFetch(false);
      } finally {
        setBusyId(null);
      }
    },
    [user, items, runFetch],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    const generation = fetchGenerationRef.current;
    setLoadingMore(true);
    setError(null);

    try {
      const {
        data,
        error: fetchError,
        nextCursor: fetchedNextCursor,
      } = await fetchLinkUps(nextCursor);

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const prepared = await prepareRows(data);
      if (generation !== fetchGenerationRef.current) {
        return;
      }

      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...prepared.filter((item) => !existingIds.has(item.id)),
        ];
      });
      setNextCursor(fetchedNextCursor);
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, nextCursor, prepareRows]);

  const refresh = useCallback(() => {
    void runFetch(true);
  }, [runFetch]);

  const deleteAsHost = useCallback(
    async (linkupId: string) => {
      if (!user) return { ok: false as const, error: "Sign in to manage your LinkUp." };
      setBusyId(linkupId);
      setError(null);
      try {
        const { error: deleteError } = await deleteLinkUpAsHost(linkupId);
        if (deleteError) {
          setError(deleteError.message);
          return { ok: false as const, error: deleteError.message };
        }
        await runFetch(false);
        return { ok: true as const, error: null };
      } finally {
        setBusyId(null);
      }
    },
    [user, runFetch],
  );

  return {
    items,
    loading,
    error,
    busyId,
    hasMore: Boolean(nextCursor),
    loadingMore,
    loadMore,
    refresh,
    join,
    leave,
    deleteAsHost,
    user,
    ready,
  };
}
