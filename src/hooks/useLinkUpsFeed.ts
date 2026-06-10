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
import type { LinkUpView } from "@/src/lib/linkupsTypes";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { getDisplayName } from "@/src/lib/userDisplay";

const REALTIME_REFETCH_DEBOUNCE_MS = 350;

export function useLinkUpsFeed() {
  const { user, ready } = useAuthSession();
  const [items, setItems] = useState<LinkUpView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchGenerationRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  const runFetch = useCallback(
    async (showSpinner: boolean) => {
      const generation = ++fetchGenerationRef.current;

      if (showSpinner) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await fetchLinkUps();

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setItems([]);
      } else {
        setError(null);
        setItems(data.map((row) => toLinkUpView(row, user?.id)));
      }

      if (showSpinner) {
        setLoading(false);
      }
    },
    [user?.id],
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
        }
        await runFetch(false);
      } finally {
        setBusyId(null);
      }
    },
    [user, items, runFetch],
  );

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
    refresh,
    join,
    leave,
    deleteAsHost,
    user,
    ready,
  };
}
