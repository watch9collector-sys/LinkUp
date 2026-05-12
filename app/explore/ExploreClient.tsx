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

export type NearbySpot = {
  id: string;
  title: string;
  description: string;
  location: string;
  topPct: number;
  leftPct: number;
};

export function ExploreClient() {
  const [spots, setSpots] = useState<NearbySpot[]>([]);
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

    const idx = spots.length;
    const pos = markerPosition(idx);

    setSpots((prev) => [
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `spot-${Date.now()}`,
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

  const markers: MapMeetupMarker[] = spots.map((m) => ({
    id: m.id,
    label: m.title,
    topPct: m.topPct,
    leftPct: m.leftPct,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Explore"
        description="Nearby activity, communities, and live LinkUps — local-first, in real time."
        action={
          <Button type="button" variant="primary" size="md" onClick={openModal}>
            Drop a pin
          </Button>
        }
      />

      <MapPlaceholder markers={markers} />

      <GlassCard className="text-center sm:text-left">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            {spots.length === 0 ? (
              <>
                <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Quiet around you
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/65 sm:mx-0">
                  When something is live nearby, it appears here and on the map.
                  Start a LinkUp from the LinkUps tab anytime.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Live near you
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/65 sm:mx-0">
                  {spots.length} active pin{spots.length === 1 ? "" : "s"} on the
                  map.
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3 sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={openModal}>
              {spots.length === 0 ? "Add a pin" : "Add another"}
            </Button>
          </div>
        </div>

        {spots.length > 0 ? (
          <div className="mt-8 grid gap-4 border-t border-white/[0.06] pt-8 text-left sm:grid-cols-2">
            {spots.map((m) => (
              <GlassCard
                key={m.id}
                className="border-white/[0.06] bg-[#0B0F14]/35 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  {m.location}
                </p>
                <h3 className="mt-2 text-base font-semibold text-white">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {m.description}
                </p>
              </GlassCard>
            ))}
          </div>
        ) : null}
      </GlassCard>

      <Modal open={modalOpen} title="Place on map" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            id="spot-title"
            name="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Coffee walk, pickup game…"
          />
          <TextAreaField
            id="spot-description"
            name="description"
            label="Details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="What should people expect?"
          />
          <TextInput
            id="spot-location"
            name="location"
            label="Where"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Landmark or area"
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
