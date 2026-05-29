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

if (!supabaseUrl) warnMissingEnv("NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) warnMissingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const authStorage = {
  getItem(key: string) {
    try {
      return typeof window === "undefined"
        ? memoryStorage.get(key) ?? null
        : window.localStorage.getItem(key) ?? memoryStorage.get(key) ?? null;
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
      storageKey: "linkup-auth-token",
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
