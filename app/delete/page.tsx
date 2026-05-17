"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { TextLink } from "../components/TextLink";
import { Button } from "../components/ui/Button";
import { TextAreaField } from "../components/ui/FormField";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export default function DeleteAccountPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmed) return;
    setSubmitted(true);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <TextLink href="/profile">← Back to profile</TextLink>

      <GlassCard>
        <h1 className="text-2xl font-bold tracking-tight text-red-200">
          Delete account
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-white/72">
          Request permanent deletion of your account and associated data. For
          support, privacy requests, account issues, or safety concerns,
          contact: <span className="text-emerald-300">{SUPPORT_EMAIL}</span>.
        </p>

        {submitted ? (
          <p className="mt-8 text-center text-[15px] text-white/88">
            Request received. We may follow up from{" "}
            <span className="text-emerald-300">{SUPPORT_EMAIL}</span> with a
            confirmation and processing timeline.
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
              name="reason"
              label="Reason for deletion"
              rows={4}
              placeholder="Optional — tell us what we could improve"
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

            <Button
              type="submit"
              variant="danger"
              size="md"
              fullWidth
              disabled={!confirmed}
            >
              Request Account Deletion
            </Button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
