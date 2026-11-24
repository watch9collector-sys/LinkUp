"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { TextLink } from "../components/TextLink";
import { Button } from "../components/ui/Button";
import { PageLoading } from "../components/ui/LoadingStates";
import { useAuthSession, setAuthSessionSnapshot } from "@/src/hooks/useAuthSession";
import { supabase } from "@/src/lib/supabase";
import { SUPPORT_EMAIL } from "@/src/lib/support";

type DeletionReply = { ok?: boolean; code?: string; message?: string };

export default function DeleteAccountPage() {
  const { user, ready } = useAuthSession();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <PageLoading message="Loading…" />;
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <TextLink href="/">← Back to Home</TextLink>
        <GlassCard className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Sign in required</h1>
          <p className="text-sm text-white/60">Sign in before deleting your account so we can verify your identity.</p>
          <TextLink href="/">Go to sign in</TextLink>
        </GlassCard>
      </div>
    );
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password || !user || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke<DeletionReply>("delete-account", {
        body: { confirmation: "DELETE", password },
      });
      let result = data;
      if (functionError) {
        const response = (functionError as { context?: unknown }).context;
        if (response instanceof Response) {
          try { result = (await response.clone().json()) as DeletionReply; }
          catch { /* Some function failures have no JSON body. */ }
        }
        throw new Error(result?.message || "Account deletion could not be completed. Contact support for help.");
      }
      if (!result?.ok) throw new Error(result?.message || "Deletion was not confirmed. Contact support.");

      // The account and sessions are now removed server-side. Erase local auth
      // immediately and hard-navigate to prevent stale signed-in UI.
      void supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      try { window.localStorage.removeItem("linkup-auth-token"); }
      catch { /* Private-browsing storage may be unavailable. */ }
      setAuthSessionSnapshot(null);
      window.location.replace("/account-deleted");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion failed. Contact support.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <TextLink href="/profile">← Back to profile</TextLink>
      <GlassCard>
        <h1 className="text-2xl font-bold tracking-tight text-red-200">Permanently delete your account</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/72">
          Delete your Nyvon account for <strong className="text-white">{user.email}</strong> now.
          Enter your current password to continue.
        </p>
        <div className="mt-5 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3.5 text-sm leading-relaxed text-red-100" role="note">
          This action is permanent. Deleting your account removes your profile, photos, hosted LinkUps and memberships,
          and signs you out. Other attendees will lose access to LinkUps you hosted.
          Certain records may be retained when required for safety, fraud prevention, or legal compliance.
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Accounts subject to an active safety or legal review require staff-assisted deletion.
          Contact <a className="text-emerald-300 underline" href={"mailto:" + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a> if that applies,
          or if you can no longer access your account.
        </p>

        <form onSubmit={(e) => { void handleDelete(e); }} className="mt-7 space-y-5">
          <div>
            <label htmlFor="delete-password" className="block text-sm font-medium text-white/90">Current password</label>
            <input
              id="delete-password" type="password" autoComplete="current-password"
              required value={password} disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </div>
          {error ? <p role="alert" className="rounded-xl border border-red-500/30 p-3 text-sm text-red-200">{error}</p> : null}
          <Button
            type="submit" variant="danger" size="md" fullWidth
            disabled={!password || busy}
            loading={busy}
          >
            Permanently delete my account
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
