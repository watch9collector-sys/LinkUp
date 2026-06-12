import type { User } from "@supabase/supabase-js";
import type { LinkUpView } from "@/src/lib/linkupsTypes";
import { getDisplayName } from "@/src/lib/userDisplay";

/** First name for welcome copy (e.g. "Welcome back, Joshua"). */
export function getWelcomeFirstName(user: User | null): string {
  const name = getDisplayName(user);
  if (name === "there") return "there";
  const first = name.split(/\s+/).filter(Boolean)[0];
  return first ?? name;
}

const FOUNDER_BIO_PATTERN = /developer of linkup/i;

/** Investor-facing bio copy; does not mutate stored profile data. */
export function polishProfileBio(bio: string): string {
  const trimmed = bio.trim();
  if (!trimmed) return "";
  if (FOUNDER_BIO_PATTERN.test(trimmed)) {
    return "Founder & CEO of LinkUp";
  }
  return trimmed;
}

const DEMO_LINKUP_TITLE_PATTERN = /sunset\s*run/i;

/** Polishes legacy demo LinkUp rows for investor-facing UI. */
export function polishLinkUpForDisplay(linkup: LinkUpView): LinkUpView {
  if (!DEMO_LINKUP_TITLE_PATTERN.test(linkup.title)) {
    return linkup;
  }

  return {
    ...linkup,
    title: "Coffee & Entrepreneurs",
    category: "Networking",
    location: "La Junta Coffee Company",
    description:
      "Meet local entrepreneurs, founders, and professionals for coffee and conversation.",
  };
}

export function polishDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Member";
  if (trimmed.includes("@")) {
    const local = trimmed.split("@")[0] ?? trimmed;
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}
