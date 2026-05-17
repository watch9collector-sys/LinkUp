"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { PageHeader } from "../components/PageHeader";
import { Button, ButtonLink } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <PageHeader
        title="Contact"
        description="Support, privacy requests, account help, and safety reports."
      />

      <GlassCard>
        <div className="mb-6 rounded-2xl border border-emerald-500/10 bg-[#0B0F14]/35 p-4 text-sm leading-relaxed text-white/68">
          For support, privacy requests, account issues, or safety concerns,
          contact:{" "}
          <span className="font-medium text-emerald-300">{SUPPORT_EMAIL}</span>
        </div>
        {sent ? (
          <div className="space-y-5 text-center">
            <p className="text-[15px] leading-relaxed text-white/88">
              Thanks — your request was captured locally in this MVP form. For
              urgent support, privacy, account, or safety concerns, contact{" "}
              <span className="text-emerald-300">{SUPPORT_EMAIL}</span>.
            </p>
            <ButtonLink href="/profile" variant="secondary" size="md">
              Back to app
            </ButtonLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="name"
              name="name"
              label="Name"
              required
              autoComplete="name"
              placeholder="Your name"
            />
            <TextInput
              id="email"
              name="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <TextInput
              id="subject"
              name="subject"
              label="Subject"
              required
              placeholder="Account, privacy, report, or support"
            />
            <TextAreaField
              id="message"
              name="message"
              label="Message"
              required
              rows={5}
              placeholder="How can we help?"
            />
            <Button type="submit" variant="primary" size="md" fullWidth>
              Submit
            </Button>
            <ButtonLink href="/profile" variant="secondary" size="md" fullWidth>
              Back to app
            </ButtonLink>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
