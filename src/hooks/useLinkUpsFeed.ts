"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useLinkUpsFeed() {
  const { user, ready } = useAuthSession();
  const [items, setItems] = useState<LinkUpView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runFetch = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
        setError(null);
      }
      const { data, error: fetchError } = await fetchLinkUps();
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
          void runFetch(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "linkup_attendees" },
        () => {
          void runFetch(false);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ready, runFetch]);

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
    [user, runFetch],
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
