"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "../../components/GlassCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { PageLoading } from "../../components/ui/LoadingStates";
import { inputClass, labelClass } from "../../components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { authErrorGuidance } from "@/src/lib/authUi";

export function ResetPasswordClient() {
  const [ready, setReady] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setRecoveryReady(true);
      }
      setReady(true);
    }

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(authErrorGuidance(updateError).message);
        return;
      }
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

  if (!recoveryReady) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <GlassCard className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Reset link expired</h1>
          <p className="text-sm leading-relaxed text-white/60">
            Request a new password reset email from the sign-in screen on Home.
          </p>
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
            Your password was saved. Sign in with your new password.
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
          <h1 className="text-xl font-semibold text-white">Choose a new password</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            This page opened from your reset email. Enter a new password below.
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
            Update password
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
