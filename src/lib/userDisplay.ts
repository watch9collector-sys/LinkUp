import type { User } from "@supabase/supabase-js";

export function getDisplayName(user: User | null): string {
  if (!user) return "there";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full = meta?.full_name;
  const display = meta?.display_name;
  if (typeof full === "string" && full.trim()) return full.trim();
  if (typeof display === "string" && display.trim()) return display.trim();
  if (user.email) return user.email.split("@")[0] ?? "there";
  return "there";
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
