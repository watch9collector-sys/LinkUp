"use client";

import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";

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
        description="Questions, partnerships, or support — we read every message."
      />

      <GlassCard>
        {sent ? (
          <p className="text-center text-[15px] leading-relaxed text-white/88">
            Thanks — your message was captured in this demo. Connect the form to
            your API to deliver it for real.
          </p>
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
              placeholder="What is this about?"
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
          </form>
        )}
      </GlassCard>
    </div>
  );
}
