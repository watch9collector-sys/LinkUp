/** Used in confirmation links so Supabase redirects back to this app (local or prod). */
export function getAuthEmailRedirectTo(): string | undefined {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.endsWith("/") ? site : `${site}/`;
  return undefined;
}

function lower(err: unknown): { code: string; message: string } {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message?: string }).message || "");
    const code = String((err as { code?: string }).code || "");
    return { code: code.toLowerCase(), message: message.toLowerCase() };
  }
  return { code: "", message: "" };
}

export function authErrorGuidance(err: unknown): {
  message: string;
  showResend: boolean;
} {
  const { code, message } = lower(err);

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("email address not confirmed")
  ) {
    return {
      message:
        "This email is not confirmed yet. Open the link we sent you, then sign in again. Check spam if you do not see it.",
      showResend: true,
    };
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return {
      message: "Wrong email or password. Try again or use “Create account”.",
      showResend: false,
    };
  }

  if (message.includes("user already registered") || code === "user_already_exists") {
    return {
      message: "An account with this email already exists. Switch to Sign in.",
      showResend: false,
    };
  }

  if (err instanceof Error && err.message) {
    return { message: err.message, showResend: false };
  }

  return { message: "Something went wrong. Try again.", showResend: false };
}

export function isLikelyEmailConfirmationPending(
  user: { id?: string } | null,
  session: unknown,
): boolean {
  return Boolean(user?.id) && !session;
}
