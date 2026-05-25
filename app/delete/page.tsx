"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { TextLink } from "../components/TextLink";
import { Button } from "../components/ui/Button";
import { PageLoading } from "../components/ui/LoadingStates";
import { TextAreaField } from "../components/ui/FormField";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { submitSupportRequest } from "@/src/lib/supportApi";
import { getDisplayName } from "@/src/lib/userDisplay";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export default function DeleteAccountPage() {
  const { user, ready } = useAuthSession({ skipInitialLoading: true });
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <TextLink href="/">← Back to Home</TextLink>
        <GlassCard className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Sign in required</h1>
          <p className="text-sm text-white/60">
            Sign in before requesting account deletion so we can match your account.
          </p>
          <TextLink href="/">Go to sign in</TextLink>
        </GlassCard>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmed || !user) return;
    setError(null);
    setBusy(true);
    try {
      const result = await submitSupportRequest({
        request_type: "delete_account",
        user_id: user.id,
        name: getDisplayName(user),
        email: user.email ?? "",
        subject: "Account deletion request",
        message:
          reason.trim() ||
          "User requested permanent account deletion via the in-app form.",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <TextLink href="/profile">← Back to profile</TextLink>

      <GlassCard>
        <h1 className="text-2xl font-bold tracking-tight text-red-200">
          Delete account
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-white/72">
          Submit a deletion request for{" "}
          <span className="text-emerald-300">{user.email}</span>. Our team processes
          requests manually. For urgent help, contact{" "}
          <span className="text-emerald-300">{SUPPORT_EMAIL}</span>.
        </p>

        {submitted ? (
          <p className="mt-8 text-center text-[15px] text-white/88">
            Your deletion request was recorded. We may email you from{" "}
            <span className="text-emerald-300">{SUPPORT_EMAIL}</span> with confirmation
            and timing.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div
              className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3.5 text-sm leading-relaxed text-red-100"
              role="alert"
            >
              <strong className="font-semibold text-red-50">Warning:</strong>{" "}
              Account deletion is permanent and cannot be undone.
            </div>

            <TextAreaField
              id="reason"
              label="Reason for deletion"
              rows={4}
              placeholder="Optional — tell us what we could improve"
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white/85">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-[#0B0F14]/60 text-emerald-500 focus:ring-emerald-500/45"
              />
              <span>I understand this action is permanent.</span>
            </label>

            {error ? (
              <p
                className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200/95"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="danger"
              size="md"
              fullWidth
              disabled={!confirmed}
              loading={busy}
            >
              Submit deletion request
            </Button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
