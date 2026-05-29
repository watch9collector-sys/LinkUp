"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "../../components/GlassCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { PageLoading } from "../../components/ui/LoadingStates";
import { inputClass, labelClass } from "../../components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { authErrorGuidance, getAuthPasswordResetRedirectTo } from "@/src/lib/authUi";
import {
  clearPasswordRecoveryFlags,
  hasAuthCallbackCode,
  isPasswordRecoveryPending,
  isPasswordResetCallbackRoute,
  isRecoveryAuthUrl,
  sessionRequiresPasswordReset,
  setPasswordRecoveryPending,
} from "@/src/lib/authRecovery";
import { setAuthSessionSnapshot } from "@/src/hooks/useAuthSession";

export function ResetPasswordClient() {
  const [ready, setReady] = useState(false);
  const [mustSetPassword, setMustSetPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function requireNewPassword() {
      setPasswordRecoveryPending(true);
      setMustSetPassword(true);
    }

    if (
      isRecoveryAuthUrl() ||
      isPasswordRecoveryPending() ||
      (isPasswordResetCallbackRoute() && hasAuthCallbackCode())
    ) {
      requireNewPassword();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        requireNewPassword();
        return;
      }
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user &&
        sessionRequiresPasswordReset(session.user.email)
      ) {
        requireNewPassword();
      }
    });

    async function init() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError && process.env.NODE_ENV !== "production") {
        console.warn("[LinkUp] reset-password getSession:", sessionError.message);
      }

      const recoveryRequired =
        isRecoveryAuthUrl() ||
        isPasswordRecoveryPending() ||
        (isPasswordResetCallbackRoute() && hasAuthCallbackCode()) ||
        (data.session?.user &&
          sessionRequiresPasswordReset(data.session.user.email));

      if (recoveryRequired) {
        requireNewPassword();
      } else if (data.session) {
        window.location.replace("/");
        return;
      }

      if (data.session && window.location.hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      setReady(true);
    }

    void init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextPassword = password.trim();
    const confirmPassword = confirm.trim();

    if (nextPassword.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: nextPassword,
      });
      if (updateError) {
        setError(authErrorGuidance(updateError).message);
        return;
      }

      clearPasswordRecoveryFlags();
      await supabase.auth.signOut();
      setAuthSessionSnapshot(null);
      setDone(true);
    } catch (err: unknown) {
      setError(authErrorGuidance(err).message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <PageLoading message="Loading reset link…" />
      </div>
    );
  }

  if (!mustSetPassword) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <GlassCard className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Reset link expired</h1>
          <p className="text-sm leading-relaxed text-white/60">
            Request a new password reset email from Home → Sign in → Forgot password?
          </p>
          {process.env.NODE_ENV !== "production" ? (
            <p className="text-xs leading-relaxed text-white/45">
              Allowlist in Supabase:{" "}
              <span className="text-emerald-300/90">
                {getAuthPasswordResetRedirectTo() ?? "(your origin)/auth/reset-password"}
              </span>
            </p>
          ) : null}
          <ButtonLink href="/" variant="primary" size="md">
            Back to Home
          </ButtonLink>
        </GlassCard>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <GlassCard className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Password updated</h1>
          <p className="text-sm leading-relaxed text-white/60">
            Your new password is saved. Sign in with that password (not your old one).
          </p>
          <ButtonLink href="/" variant="primary" size="md">
            Go to sign in
          </ButtonLink>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <GlassCard className="space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Set new password</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            You opened a password reset link. Choose a new password below, then sign in
            with it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className={labelClass}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              className={inputClass}
            />
          </div>
          {error ? (
            <p
              className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200/95"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>
            Save new password
          </Button>
        </form>

        <p className="text-center text-xs text-white/45">
          <Link href="/" className="text-emerald-300/90 hover:underline">
            Back to Home
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
