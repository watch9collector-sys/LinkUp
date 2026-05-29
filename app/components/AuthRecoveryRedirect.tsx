"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import {
  redirectToPasswordResetPage,
  sessionRequiresPasswordReset,
  setPasswordRecoveryPending,
  shouldSendUserToPasswordReset,
} from "@/src/lib/authRecovery";
import { useAuthSession } from "@/src/hooks/useAuthSession";

/**
 * Catches recovery redirects and sessions that must set a new password.
 */
export function AuthRecoveryRedirect() {
  const pathname = usePathname();
  const { session, ready } = useAuthSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (shouldSendUserToPasswordReset(pathname)) {
      redirectToPasswordResetPage();
      return;
    }

    if (ready && session?.user && sessionRequiresPasswordReset(session.user.email)) {
      redirectToPasswordResetPage();
    }
  }, [pathname, ready, session?.user?.email, session]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryPending(true);
        redirectToPasswordResetPage();
        return;
      }
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        nextSession?.user &&
        sessionRequiresPasswordReset(nextSession.user.email)
      ) {
        redirectToPasswordResetPage();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
