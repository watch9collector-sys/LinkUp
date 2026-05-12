"use client";

import { useCallback, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";

export type LinkUp = {
  id: string;
  intent: string;
  where: string;
};

export function LinkUpsClient() {
  const [items, setItems] = useState<LinkUp[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [intent, setIntent] = useState("");
  const [where, setWhere] = useState("");

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIntent("");
    setWhere("");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const i = intent.trim();
    const w = where.trim();
    if (!i || !w) return;

    setItems((prev) => [
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `lu-${Date.now()}`,
        intent: i,
        where: w,
      },
      ...prev,
    ]);
    closeModal();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="LinkUps"
        description="Create a live invite or join one nearby — built for showing up, not scrolling."
        action={
          items.length > 0 ? (
            <Button type="button" variant="primary" size="md" onClick={openModal}>
              New LinkUp
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No active LinkUps"
          description="Post what you want to do and where. People nearby can see it and join in real time."
          action={
            <Button type="button" variant="primary" size="lg" onClick={openModal}>
              Start a LinkUp
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((lu) => (
            <GlassCard
              key={lu.id}
              className="flex flex-col border-white/[0.06] text-left"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Where
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-400/90">{lu.where}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-white/40">
                Plan
              </p>
              <p className="mt-1 flex-1 text-[15px] leading-relaxed text-white/85">
                {lu.intent}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="New LinkUp" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextAreaField
            id="linkup-intent"
            name="intent"
            label="What do you want to do?"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            required
            rows={4}
            placeholder="Short and specific — others decide in seconds."
          />
          <TextInput
            id="linkup-where"
            name="where"
            label="Where"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            required
            placeholder="Neighborhood, venue, or meet spot"
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
