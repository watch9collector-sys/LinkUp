import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  redirectToPasswordResetPage,
  setPasswordRecoveryPending,
} from "@/src/lib/authRecovery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function warnMissingEnv(label: string) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[LinkUp] Missing ${label}. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.`,
    );
  }
}

type LinkUpSupabaseGlobal = typeof globalThis & {
  __linkupSupabase?: SupabaseClient;
};

const linkUpGlobal = globalThis as LinkUpSupabaseGlobal;
const memoryStorage = new Map<string, string>();
const AUTH_STORAGE_KEY = "linkup-auth-token";

if (!supabaseUrl) warnMissingEnv("NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) warnMissingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function accessTokenFromStoredSession(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

/** Drop sessions issued by a different Supabase project (e.g. after switching .env.local). */
function sessionBelongsToConfiguredProject(accessToken: string): boolean {
  if (!supabaseUrl) return true;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return false;

  const expectedHost = new URL(supabaseUrl).host;
  const expectedRef = expectedHost.split(".")[0];

  if (typeof payload.ref === "string") {
    return payload.ref === expectedRef;
  }

  if (typeof payload.iss === "string") {
    try {
      return new URL(payload.iss).host === expectedHost;
    } catch {
      return false;
    }
  }

  return false;
}

function purgeStaleStoredSession(key: string) {
  memoryStorage.delete(key);
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

const authStorage = {
  getItem(key: string) {
    try {
      const value =
        typeof window === "undefined"
          ? memoryStorage.get(key) ?? null
          : window.localStorage.getItem(key) ?? memoryStorage.get(key) ?? null;

      if (
        key === AUTH_STORAGE_KEY &&
        value &&
        supabaseUrl &&
        typeof window !== "undefined"
      ) {
        const accessToken = accessTokenFromStoredSession(value);
        if (accessToken && !sessionBelongsToConfiguredProject(accessToken)) {
          purgeStaleStoredSession(key);
          return null;
        }
      }

      return value;
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem(key: string, value: string) {
    memoryStorage.set(key, value);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch {
      // Mobile Safari can reject storage in some privacy modes; auth should fail gracefully.
    }
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures so sign-out does not break navigation.
    }
  },
};

/** Explicit public schema for PostgREST `.from()` — matches SQL `public.linkups` etc. */
export const supabase =
  linkUpGlobal.__linkupSupabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "public" },
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
    },
  });

linkUpGlobal.__linkupSupabase = supabase;

/** Must run before any getSession() so recovery links never stick on Home. */
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setPasswordRecoveryPending(true);
      redirectToPasswordResetPage();
      return;
    }

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      const email = session?.user?.email?.trim().toLowerCase();
      if (!email) return;
      try {
        const requested = window.sessionStorage.getItem(
          "linkup-password-reset-requested-email",
        );
        if (requested && requested === email) {
          setPasswordRecoveryPending(true);
          redirectToPasswordResetPage();
        }
      } catch {
        // Ignore storage errors.
      }
    }
  });
}
