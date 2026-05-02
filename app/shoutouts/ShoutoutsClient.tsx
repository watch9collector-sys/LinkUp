"use client";

import { useCallback, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";

export type Shoutout = {
  id: string;
  message: string;
  location: string;
};

export function ShoutoutsClient() {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setMessage("");
    setLocation("");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedMessage = message.trim();
    const trimmedLocation = location.trim();
    if (!trimmedMessage || !trimmedLocation) return;

    setShoutouts((prev) => [
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `sh-${Date.now()}`,
        message: trimmedMessage,
        location: trimmedLocation,
      },
      ...prev,
    ]);
    closeModal();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shoutouts"
        description="Send a location-based invite so people nearby can see you and respond."
        action={
          shoutouts.length > 0 ? (
            <Button type="button" variant="primary" size="md" onClick={openModal}>
              New shoutout
            </Button>
          ) : null
        }
      />

      {shoutouts.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No shoutouts yet"
          description="When you post a shoutout, it will show up here for others in your area."
          action={
            <Button type="button" variant="primary" size="lg" onClick={openModal}>
              Create First Shoutout
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {shoutouts.map((s) => (
            <GlassCard
              key={s.id}
              className="flex flex-col border-emerald-500/8 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                Location
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-400/95">
                {s.location}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/45">
                Message
              </p>
              <p className="mt-1 flex-1 text-[15px] leading-relaxed text-white/88">
                {s.message}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Create shoutout" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextAreaField
            id="shoutout-message"
            name="message"
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder="What do you want people to know?"
          />
          <TextInput
            id="shoutout-location"
            name="location"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Neighborhood or venue"
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save shoutout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
