import { createClient } from "@supabase/supabase-js";

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

if (!supabaseUrl) warnMissingEnv("NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) warnMissingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** Explicit public schema for PostgREST `.from()` — matches SQL `public.linkups` etc. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: "public" },
});
