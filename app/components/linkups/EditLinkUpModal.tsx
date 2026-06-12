"use client";

import { useCallback, useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { SelectField, TextAreaField, TextInput } from "../ui/FormField";
import { GEOCODE_FAILED_MESSAGE, geocodeLocationLabel } from "@/src/lib/geocode";
import { updateLinkUpAsHost } from "@/src/lib/linkupsApi";
import { LINKUP_CATEGORIES, type LinkUpView } from "@/src/lib/linkupsTypes";

function minLocalDatetimeValue(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type EditLinkUpModalProps = {
  open: boolean;
  linkup: LinkUpView | null;
  onClose: () => void;
  onUpdated: () => void;
};

type EditLinkUpFormProps = {
  linkup: LinkUpView;
  onClose: () => void;
  onUpdated: () => void;
};

function EditLinkUpForm({ linkup, onClose, onUpdated }: EditLinkUpFormProps) {
  const [title, setTitle] = useState(linkup.title);
  const [category, setCategory] = useState<string>(linkup.category);
  const [locationLabel, setLocationLabel] = useState(linkup.location);
  const [startsLocal, setStartsLocal] = useState(toLocalDatetimeValue(linkup.starts_at));
  const [description, setDescription] = useState(linkup.description);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const minLocal = minLocalDatetimeValue();

  const close = useCallback(() => {
    setFormError(null);
    onClose();
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setFormError(null);
    const t = title.trim();
    const loc = locationLabel.trim();
    const desc = description.trim();
    if (!t || !loc || !startsLocal) {
      setFormError("Title, location, and time are required.");
      return;
    }
    const starts = new Date(startsLocal);
    if (Number.isNaN(starts.getTime())) {
      setFormError("Pick a valid date and time.");
      return;
    }

    setSaving(true);
    try {
      const geocoded = await geocodeLocationLabel(loc);
      if (!geocoded) {
        setFormError(GEOCODE_FAILED_MESSAGE);
        return;
      }

      const { error } = await updateLinkUpAsHost(linkup.id, {
        title: t,
        category,
        location: geocoded.displayName,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        starts_at: starts.toISOString(),
        description: desc,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      onUpdated();
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        id="edit-lu-title"
        label="Title"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        required
        maxLength={120}
        placeholder="Coffee meetup, study session, community run…"
      />
      <SelectField
        id="edit-lu-category"
        label="Category"
        value={category}
        onChange={(ev) => setCategory(ev.target.value)}
        required
      >
        {LINKUP_CATEGORIES.map((c) => (
          <option key={c} value={c} className="bg-slate-900 text-white">
            {c}
          </option>
        ))}
      </SelectField>
      <TextInput
        id="edit-lu-location"
        label="Location"
        value={locationLabel}
        onChange={(ev) => setLocationLabel(ev.target.value)}
        required
        placeholder="Enter a venue, address, or landmark"
      />
      <p className="-mt-2 text-xs leading-relaxed text-white/42">
        A clear location helps people find you on the map.
      </p>
      <div>
        <label
          htmlFor="edit-lu-starts"
          className="block text-sm font-medium tracking-tight text-white/88"
        >
          Starts
        </label>
        <input
          id="edit-lu-starts"
          type="datetime-local"
          required
          min={minLocal}
          value={startsLocal}
          onChange={(ev) => setStartsLocal(ev.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0B0F14]/60 px-3.5 py-2.5 text-[15px] text-white shadow-inner shadow-black/40 outline-none transition focus:border-emerald-500/45 focus:ring-2 focus:ring-emerald-500/25"
        />
      </div>
      <TextAreaField
        id="edit-lu-desc"
        label="What to expect"
        value={description}
        onChange={(ev) => setDescription(ev.target.value)}
        rows={3}
        maxLength={500}
        placeholder="What should attendees expect?"
      />
      <p className="-mt-2 text-xs leading-relaxed text-white/42">
        Clear details help people decide to join.
      </p>
      {formError ? (
        <p
          className="whitespace-pre-wrap text-left text-sm text-red-300/95"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" size="md" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function EditLinkUpModal({
  open,
  linkup,
  onClose,
  onUpdated,
}: EditLinkUpModalProps) {
  if (!linkup) return null;

  return (
    <Modal open={open} title="Edit LinkUp" onClose={onClose}>
      <EditLinkUpForm
        key={linkup.id}
        linkup={linkup}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    </Modal>
  );
}
