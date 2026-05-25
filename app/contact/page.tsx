"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { PageHeader } from "../components/PageHeader";
import { Button, ButtonLink } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { submitSupportRequest } from "@/src/lib/supportApi";
import { SUPPORT_EMAIL } from "@/src/lib/support";

export default function ContactPage() {
  const { user } = useAuthSession({ skipInitialLoading: true });
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await submitSupportRequest({
        request_type: "contact",
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <PageHeader
        title="Contact"
        description="Support, privacy requests, account help, and safety reports."
      />

      <GlassCard>
        <div className="mb-6 rounded-2xl border border-emerald-500/10 bg-[#0B0F14]/35 p-4 text-sm leading-relaxed text-white/68">
          Urgent issues can also be emailed directly:{" "}
          <span className="font-medium text-emerald-300">{SUPPORT_EMAIL}</span>
        </div>
        {sent ? (
          <div className="space-y-5 text-center">
            <p className="text-[15px] leading-relaxed text-white/88">
              Your message was saved securely. Our team will follow up at the email you
              provided.
            </p>
            <ButtonLink href="/profile" variant="secondary" size="md">
              Back to app
            </ButtonLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="name"
              label="Name"
              required
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
            />
            <TextInput
              id="email"
              name="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
            <TextInput
              id="subject"
              label="Subject"
              required
              placeholder="Account, privacy, report, or support"
              value={subject}
              onChange={(ev) => setSubject(ev.target.value)}
            />
            <TextAreaField
              id="message"
              label="Message"
              required
              rows={5}
              placeholder="How can we help?"
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
            />
            {error ? (
              <p
                className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200/95"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" size="md" fullWidth loading={busy}>
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
