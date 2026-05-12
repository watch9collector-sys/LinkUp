"use client";

import { useCallback, useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { SelectField, TextAreaField, TextInput } from "../ui/FormField";
import { createLinkUp } from "@/src/lib/linkupsApi";
import { LINKUP_CATEGORIES } from "@/src/lib/linkupsTypes";
import type { User } from "@supabase/supabase-js";
import { getDisplayName } from "@/src/lib/userDisplay";

function minLocalDatetimeValue(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type CreateLinkUpModalProps = {
  open: boolean;
  onClose: () => void;
  user: User;
  onCreated: () => void;
};

export function CreateLinkUpModal({
  open,
  onClose,
  user,
  onCreated,
}: CreateLinkUpModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(LINKUP_CATEGORIES[0]);
  const [locationLabel, setLocationLabel] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const minLocal = minLocalDatetimeValue();

  const reset = useCallback(() => {
    setTitle("");
    setCategory(LINKUP_CATEGORIES[0]);
    setLocationLabel("");
    setStartsLocal("");
    setDescription("");
    setFormError(null);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

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
      const { error } = await createLinkUp({
        title: t,
        category,
        location: loc,
        starts_at: starts.toISOString(),
        description: desc,
        host_id: user.id,
        host_display_name: getDisplayName(user),
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      reset();
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="New LinkUp" onClose={close}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          id="lu-title"
          label="Title"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          required
          maxLength={120}
          placeholder="Sunset run, co-work hour…"
        />
        <SelectField
          id="lu-category"
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
          id="lu-location"
          label="Location"
          value={locationLabel}
          onChange={(ev) => setLocationLabel(ev.target.value)}
          required
          placeholder="Neighborhood, venue, or address"
        />
        <div>
          <label htmlFor="lu-starts" className="block text-sm font-medium tracking-tight text-white/88">
            Starts
          </label>
          <input
            id="lu-starts"
            type="datetime-local"
            required
            min={minLocal}
            value={startsLocal}
            onChange={(ev) => setStartsLocal(ev.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0B0F14]/60 px-3.5 py-2.5 text-[15px] text-white shadow-inner shadow-black/40 outline-none transition focus:border-emerald-500/45 focus:ring-2 focus:ring-emerald-500/25"
          />
        </div>
        <TextAreaField
          id="lu-desc"
          label="Short description"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What should people expect?"
        />
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
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
