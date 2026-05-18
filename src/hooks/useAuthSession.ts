"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

const AUTH_SESSION_TIMEOUT_MS = 3500;

type AuthSessionOptions = {
  skipInitialLoading?: boolean;
};

let currentSession: Session | null = null;
let currentReady = false;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function publish(nextSession: Session | null, nextReady = true) {
  currentSession = nextSession;
  currentReady = nextReady;
  notify();
}

function publishHydratedSession(nextSession: Session | null) {
  if (!nextSession && currentSession) {
    currentReady = true;
    notify();
    return;
  }
  publish(nextSession);
}

function initializeAuthSession() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  let sessionResolved = false;

  function finish(nextSession: Session | null) {
    sessionResolved = true;
    window.clearTimeout(fallback);
    publishHydratedSession(nextSession);
  }

  const fallback = window.setTimeout(() => {
    if (sessionResolved) return;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[LinkUp] getSession timed out; continuing signed out");
    }
    finish(null);
  }, AUTH_SESSION_TIMEOUT_MS);

  try {
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[LinkUp] getSession:", error.message);
          }
          finish(null);
        } else {
          finish(data.session ?? null);
        }
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[LinkUp] getSession failed", err);
        }
        finish(null);
      });

    const authState = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        if (process.env.NODE_ENV !== "production") {
          console.info("[LinkUp] auth state change", {
            event,
            hasSession: Boolean(nextSession),
            userId: nextSession?.user?.id ?? null,
          });
        }

        if (!nextSession && event !== "SIGNED_OUT" && currentSession) {
          currentReady = true;
          notify();
          return;
        }

        publish(nextSession);
      },
    );
    void authState.data.subscription;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[LinkUp] auth setup failed", err);
    }
    finish(null);
  }
}

export function setAuthSessionSnapshot(nextSession: Session | null) {
  publish(nextSession);
}

function getSessionWithTimeout() {
  return new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>(
    (resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error("Session refresh timed out"));
      }, AUTH_SESSION_TIMEOUT_MS);

      supabase.auth
        .getSession()
        .then((result) => {
          window.clearTimeout(timeout);
          resolve(result);
        })
        .catch((err: unknown) => {
          window.clearTimeout(timeout);
          reject(err);
        });
    },
  );
}

export async function refreshAuthSessionSnapshot() {
  try {
    const { data, error } = await getSessionWithTimeout();
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[LinkUp] refresh getSession:", error.message);
      }
      return currentSession;
    }
    publishHydratedSession(data.session ?? null);
    return data.session ?? currentSession;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[LinkUp] refresh getSession failed", err);
    }
    return currentSession;
  }
}

export function useAuthSession(options: AuthSessionOptions = {}) {
  const skipInitialLoading = options.skipInitialLoading ?? false;
  const [snapshot, setSnapshot] = useState(() => ({
    session: currentSession,
    ready: currentReady || skipInitialLoading,
  }));

  useEffect(() => {
    initializeAuthSession();

    function updateSnapshot() {
      setSnapshot({
        session: currentSession,
        ready: currentReady || skipInitialLoading,
      });
    }

    listeners.add(updateSnapshot);
    updateSnapshot();

    return () => {
      listeners.delete(updateSnapshot);
    };
  }, [skipInitialLoading]);

  return {
    session: snapshot.session,
    user: snapshot.session?.user ?? null,
    ready: snapshot.ready,
  };
}
