/** User must complete password reset before using the app. */
export const PASSWORD_RECOVERY_PENDING_KEY = "linkup-password-recovery-pending";

/** Set when user requested a reset email (fallback if PASSWORD_RECOVERY event is missed). */
export const PASSWORD_RESET_REQUESTED_EMAIL_KEY = "linkup-password-reset-requested-email";

export function isPasswordRecoveryPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PASSWORD_RECOVERY_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPasswordRecoveryPending(active: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      window.sessionStorage.setItem(PASSWORD_RECOVERY_PENDING_KEY, "1");
    } else {
      window.sessionStorage.removeItem(PASSWORD_RECOVERY_PENDING_KEY);
    }
  } catch {
    // Ignore private mode / storage blocks.
  }
}

export function getPasswordResetRequestedEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(PASSWORD_RESET_REQUESTED_EMAIL_KEY);
    return value?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

export function setPasswordResetRequestedEmail(email: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (email) {
      window.sessionStorage.setItem(
        PASSWORD_RESET_REQUESTED_EMAIL_KEY,
        email.trim().toLowerCase(),
      );
    } else {
      window.sessionStorage.removeItem(PASSWORD_RESET_REQUESTED_EMAIL_KEY);
    }
  } catch {
    // Ignore.
  }
}

export function clearPasswordRecoveryFlags() {
  setPasswordRecoveryPending(false);
  setPasswordResetRequestedEmail(null);
}

type LocationParts = Pick<Location, "pathname" | "hash" | "search">;

function readLocation(location?: Partial<LocationParts>): LocationParts {
  if (location) {
    return {
      pathname: location.pathname ?? "",
      hash: location.hash ?? "",
      search: location.search ?? "",
    };
  }
  if (typeof window === "undefined") {
    return { pathname: "", hash: "", search: "" };
  }
  return window.location;
}

/** Hash fragment uses type=recovery (implicit OAuth flow). */
export function isRecoveryAuthUrl(location?: Partial<LocationParts>): boolean {
  const loc = readLocation(location);
  const hash = loc.hash?.toLowerCase() ?? "";
  const search = loc.search?.toLowerCase() ?? "";

  if (hash.includes("type=recovery")) return true;
  if (search.includes("type=recovery")) return true;

  const params = new URLSearchParams(loc.search ?? "");
  if (params.get("type") === "recovery") return true;

  return false;
}

/** PKCE recovery lands on redirect URL with ?code= (no type= in URL). */
export function isPasswordResetCallbackRoute(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/auth/reset-password");
}

export function hasAuthCallbackCode(location?: Partial<LocationParts>): boolean {
  const loc = readLocation(location);
  return new URLSearchParams(loc.search ?? "").has("code");
}

export function passwordResetPageUrl(location?: Partial<LocationParts>): string {
  const loc = readLocation(location);
  return `/auth/reset-password${loc.search ?? ""}${loc.hash ?? ""}`;
}

export function shouldSendUserToPasswordReset(
  pathname?: string,
  location?: Partial<LocationParts>,
): boolean {
  const loc = readLocation(location);
  const path = pathname ?? loc.pathname;
  if (path.startsWith("/auth/reset-password")) return false;
  return isRecoveryAuthUrl(loc);
}

/** True when this browser recently asked for a reset for the signed-in email. */
export function sessionRequiresPasswordReset(userEmail: string | undefined): boolean {
  if (!userEmail) return isPasswordRecoveryPending();
  const requested = getPasswordResetRequestedEmail();
  if (!requested) return isPasswordRecoveryPending();
  return (
    isPasswordRecoveryPending() ||
    requested === userEmail.trim().toLowerCase()
  );
}

export function redirectToPasswordResetPage() {
  if (typeof window === "undefined") return;
  setPasswordRecoveryPending(true);
  const target = passwordResetPageUrl();
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== target) {
    window.location.assign(target);
  }
}

/** Inline script body — runs before React hydrates (hash recovery only). */
export const RECOVERY_REDIRECT_SCRIPT = `
(function () {
  try {
    var path = window.location.pathname || "";
    if (path.indexOf("/auth/reset-password") === 0) return;
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    if (
      hash.indexOf("type=recovery") !== -1 ||
      search.indexOf("type=recovery") !== -1
    ) {
      sessionStorage.setItem("linkup-password-recovery-pending", "1");
      window.location.replace(
        "/auth/reset-password" + search + hash
      );
    }
  } catch (e) {}
})();
`;
