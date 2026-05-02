"use client";

import { useCallback, useState } from "react";
import { GlassCard } from "../components/GlassCard";
import type { MapMeetupMarker } from "../components/MapPlaceholder";
import { MapPlaceholder } from "../components/MapPlaceholder";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { TextAreaField, TextInput } from "../components/ui/FormField";

function markerPosition(index: number): { topPct: number; leftPct: number } {
  const left = 18 + ((index * 41 + 7) % 64);
  const top = 18 + ((index * 29 + 11) % 52);
  return { leftPct: Math.min(left, 82), topPct: Math.min(top, 78) };
}

export type Meetup = {
  id: string;
  title: string;
  description: string;
  location: string;
  topPct: number;
  leftPct: number;
};

export function DiscoverClient() {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTitle("");
    setDescription("");
    setLocation("");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    const l = location.trim();
    if (!t || !d || !l) return;

    const idx = meetups.length;
    const pos = markerPosition(idx);

    setMeetups((prev) => [
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `mu-${Date.now()}`,
        title: t,
        description: d,
        location: l,
        topPct: pos.topPct,
        leftPct: pos.leftPct,
      },
      ...prev,
    ]);
    closeModal();
  }

  const markers: MapMeetupMarker[] = meetups.map((m) => ({
    id: m.id,
    label: m.title,
    topPct: m.topPct,
    leftPct: m.leftPct,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discover"
        description="Map preview and meetups near you. Create your own when nothing is scheduled."
        action={
          <Button type="button" variant="primary" size="md" onClick={openModal}>
            Create Meetup
          </Button>
        }
      />

      <MapPlaceholder markers={markers} />

      <GlassCard className="text-center sm:text-left">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-4xl leading-none" aria-hidden>
              📍
            </p>
            {meetups.length === 0 ? (
              <>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  No meetups available
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/68 sm:mx-0">
                  Nothing is live in your area right now. Host a spot and invite
                  others to join.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Meetups near you
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/68 sm:mx-0">
                  {meetups.length} active meetup{meetups.length === 1 ? "" : "s"}{" "}
                  on the map.
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={openModal}
            >
              {meetups.length === 0 ? "Create your own" : "Add another"}
            </Button>
          </div>
        </div>

        {meetups.length > 0 ? (
          <div className="mt-8 grid gap-4 border-t border-emerald-500/10 pt-8 text-left sm:grid-cols-2">
            {meetups.map((m) => (
              <GlassCard
                key={m.id}
                className="border-emerald-500/10 bg-[#0B0F14]/40 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                  {m.location}
                </p>
                <h3 className="mt-2 text-base font-bold text-white">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/72">
                  {m.description}
                </p>
              </GlassCard>
            ))}
          </div>
        ) : null}
      </GlassCard>

      <Modal open={modalOpen} title="Create meetup" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            id="meetup-title"
            name="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Coffee at Riverside Park"
          />
          <TextAreaField
            id="meetup-description"
            name="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="What should people expect?"
          />
          <TextInput
            id="meetup-location"
            name="location"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Address or landmark"
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save meetup
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
