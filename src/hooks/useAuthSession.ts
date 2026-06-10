"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { isUserFacingDevMode } from "@/src/lib/userFacingErrors";

const AUTH_SESSION_TIMEOUT_MS = 8000;
const AUTH_SESSION_MAX_ATTEMPTS = 2;
export const PROFILE_SAVE_TIMEOUT_MS = 20000;

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
  publish(nextSession);
}

function logProfileAuth(phase: string, detail?: unknown) {
  if (!isUserFacingDevMode()) return;
  console.info(`[LinkUp profile auth] ${phase}`, detail ?? "");
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

/** Immediately reflect auth.updateUser() in the client session snapshot. */
export function applyAuthUserUpdate(user: User) {
  if (!currentSession) return;
  publishHydratedSession({ ...currentSession, user });
}

/**
 * After profile save, prefer the user returned by updateUser, then confirm via getUser().
 * Avoids navigating to /profile with stale metadata on slow networks.
 */
export async function syncAuthUserAfterProfileSave(
  updatedUser: User | undefined,
): Promise<{ confirmed: boolean; session: Session | null }> {
  if (updatedUser) {
    applyAuthUserUpdate(updatedUser);
    logProfileAuth("applied updateUser response", { userId: updatedUser.id });
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      PROFILE_SAVE_TIMEOUT_MS,
      "Session refresh timed out. Your profile was saved — reload if changes do not appear.",
    );
    if (error || !data.user) {
      logProfileAuth("getUser after save failed", error ?? "no user");
      return { confirmed: Boolean(updatedUser), session: currentSession };
    }

    if (currentSession) {
      const next = { ...currentSession, user: data.user };
      publishHydratedSession(next);
      logProfileAuth("getUser confirmed", { userId: data.user.id });
      return { confirmed: true, session: next };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    publishHydratedSession(sessionData.session ?? null);
    return { confirmed: true, session: sessionData.session ?? null };
  } catch (err: unknown) {
    logProfileAuth("sync after save error", err);
    return { confirmed: Boolean(updatedUser), session: currentSession };
  }
}

async function loadInitialSession(): Promise<Session | null> {
  for (let attempt = 1; attempt <= AUTH_SESSION_MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_SESSION_TIMEOUT_MS,
        "getSession timed out",
      );
      if (error) {
        logProfileAuth(`getSession attempt ${attempt} error`, error.message);
        continue;
      }
      return data.session ?? null;
    } catch (err: unknown) {
      logProfileAuth(`getSession attempt ${attempt} failed`, err);
    }
  }
  return null;
}

function initializeAuthSession() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    void loadInitialSession()
      .then((session) => {
        publishHydratedSession(session);
      })
      .catch((err: unknown) => {
        logProfileAuth("initial session load failed", err);
        publishHydratedSession(null);
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
    logProfileAuth("auth setup failed", err);
    publishHydratedSession(null);
  }
}

export function setAuthSessionSnapshot(nextSession: Session | null) {
  publish(nextSession);
}

export async function refreshAuthSessionSnapshot() {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_SESSION_TIMEOUT_MS,
      "Session refresh timed out",
    );
    if (error || !data.user) {
      logProfileAuth("refresh getUser error", error ?? "no user");
      return currentSession;
    }
    if (currentSession) {
      const next = { ...currentSession, user: data.user };
      publishHydratedSession(next);
      return next;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    publishHydratedSession(sessionData.session ?? null);
    return sessionData.session ?? currentSession;
  } catch (err: unknown) {
    logProfileAuth("refresh getUser failed", err);
    return currentSession;
  }
}

export function useAuthSession() {
  const [snapshot, setSnapshot] = useState(() => ({
    session: currentSession,
    ready: currentReady,
  }));

  useEffect(() => {
    initializeAuthSession();

    function updateSnapshot() {
      setSnapshot({
        session: currentSession,
        ready: currentReady,
      });
    }

    listeners.add(updateSnapshot);
    updateSnapshot();

    return () => {
      listeners.delete(updateSnapshot);
    };
  }, []);

  return {
    session: snapshot.session,
    user: snapshot.session?.user ?? null,
    ready: snapshot.ready,
  };
}
