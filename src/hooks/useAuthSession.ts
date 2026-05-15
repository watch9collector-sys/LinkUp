"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
            console.warn("[LinkUp] getSession:", error.message);
          }
          setSession(null);
        } else {
          setSession(data.session ?? null);
        }
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          console.warn("[LinkUp] getSession failed", err);
        }
        setSession(null);
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    ready,
  };
}
