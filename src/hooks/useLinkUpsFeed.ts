"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/src/lib/supabase";
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

const REALTIME_REFETCH_DEBOUNCE_MS = 350;

export function useLinkUpsFeed() {
  const { user, ready } = useAuthSession();
  const [items, setItems] = useState<LinkUpView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<LinkUpsCursor | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchGenerationRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

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

  const scheduleRealtimeRefetch = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void runFetch(false);
    }, REALTIME_REFETCH_DEBOUNCE_MS);
  }, [runFetch]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      void runFetch(true);
    }, 0);
    return () => clearTimeout(id);
  }, [ready, runFetch]);

  useEffect(() => {
    if (!ready) return;
    const channel = supabase
      .channel("linkups-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "linkups" },
        () => {
          scheduleRealtimeRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "linkup_attendees" },
        () => {
          scheduleRealtimeRefetch();
        },
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      fetchGenerationRef.current += 1;
      void supabase.removeChannel(channel);
    };
  }, [ready, scheduleRealtimeRefetch]);

  const join = useCallback(
    async (linkupId: string) => {
      if (!user) return;
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
    [user, runFetch],
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
