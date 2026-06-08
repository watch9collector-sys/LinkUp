type PostgrestLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function isUserFacingDevMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_LINKUP_AUTH_DEBUG === "true"
  );
}

export function logUserFacingError(label: string, error: unknown): void {
  if (!isUserFacingDevMode()) return;
  console.warn(`[LinkUp] ${label}`, error);
}

function formatPostgrestVerbose(error: PostgrestLikeError): string {
  const message = error.message?.trim();
  const code = error.code?.trim();
  const details = typeof error.details === "string" ? error.details.trim() : "";
  const hint = typeof error.hint === "string" ? error.hint.trim() : "";

  const parts: string[] = [];
  if (message) parts.push(message);
  if (code) parts.push(`(${code})`);
  if (details) parts.push(details);
  if (hint) parts.push(hint);

  return parts.join(" ") || "Something went wrong. Please try again.";
}

function isSchemaCacheMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("pgrst205") ||
    lower.includes("pgrst202") ||
    (lower.includes("function") && lower.includes("does not exist")) ||
    lower.includes("could not find the table") ||
    lower.includes("does not exist")
  );
}

export function supportRequestErrorMessage(error: PostgrestLikeError): string {
  if (isUserFacingDevMode()) {
    return formatPostgrestVerbose(error);
  }

  const message = error.message ?? "";
  const code = (error.code ?? "").trim();
  const lower = message.toLowerCase();

  if (isSchemaCacheMessage(message)) {
    return "Support requests are temporarily unavailable. Please try again later or email us directly.";
  }

  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("policy")
  ) {
    return "Could not submit your request. Please try again or email us directly.";
  }

  return "Could not submit your request. Please try again.";
}

export function supportSchemaUnavailableMessage(): string {
  if (isUserFacingDevMode()) {
    return (
      "Support requests are not available on this Supabase API yet. In Dashboard → SQL Editor " +
      "(Production branch, same project as .env.local), run " +
      "supabase/migrations/20260523120000_support_requests_rpc.sql. " +
      "If Contact still fails, confirm the Dashboard project URL matches your env and use " +
      "Settings → General → Pause project → Restore once."
    );
  }

  return "Support requests are temporarily unavailable. Please try again later or email us directly.";
}

export function linkUpFeedErrorMessage(message: string): string {
  if (isUserFacingDevMode()) {
    return message.trim() || "Could not load LinkUps. Please try again.";
  }

  if (isSchemaCacheMessage(message)) {
    return "LinkUps could not be loaded right now. Please try again in a moment.";
  }

  return "Could not load LinkUps. Please try again.";
}
