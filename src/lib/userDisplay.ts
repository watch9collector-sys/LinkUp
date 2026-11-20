import type { User } from "@supabase/supabase-js";

export function getDisplayName(user: User | null): string {
  if (!user) return "there";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full = meta?.full_name;
  const display = meta?.display_name;
  if (typeof full === "string" && full.trim()) return full.trim();
  if (typeof display === "string" && display.trim()) return display.trim();
  // Never infer a public profile name from the account email address.
  // Unnamed signed-in users use a neutral label until they choose a name.
  return "Member";
}

export function getInitials(user: User | null): string {
  const name = getDisplayName(user);
  if (name === "there") return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
