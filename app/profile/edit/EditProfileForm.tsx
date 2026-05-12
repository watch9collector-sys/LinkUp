"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { GlassCard } from "../../components/GlassCard";
import { Button } from "../../components/ui/Button";
import { TextLink } from "../../components/TextLink";
import { inputClass, labelClass } from "../../components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { useAuthSession } from "@/src/hooks/useAuthSession";

function readMetaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v : "";
}

function ProfileFieldsForm({ user }: { user: User }) {
  const router = useRouter();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const [fullName, setFullName] = useState(() => readMetaString(meta, "full_name"));
  const [displayName, setDisplayName] = useState(() =>
    readMetaString(meta, "display_name"),
  );
  const [bio, setBio] = useState(() => readMetaString(meta, "bio"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          display_name: displayName.trim(),
          bio: bio.trim(),
        },
      });
      if (updateError) throw updateError;
      router.push("/profile");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Edit profile
        </h1>
        <TextLink href="/profile">← Back to profile</TextLink>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className={labelClass}>Email</p>
          <p className="mt-1 text-sm text-white/70">{user.email ?? "—"}</p>
          <p className="mt-1 text-xs text-white/45">
            Email is managed in Supabase Auth; contact support to change it.
          </p>
        </div>

        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input
            id="full_name"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            className={inputClass}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="display_name" className={labelClass}>
            Display name{" "}
            <span className="font-normal text-white/45">(optional)</span>
          </label>
          <input
            id="display_name"
            value={displayName}
            onChange={(ev) => setDisplayName(ev.target.value)}
            className={inputClass}
            placeholder="How you want to appear"
          />
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>
            Bio <span className="font-normal text-white/45">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(ev) => setBio(ev.target.value)}
            rows={4}
            className={`${inputClass} resize-y min-h-[6rem]`}
            placeholder="A short line about you…"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400/95" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-xl border border-white/[0.12] px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/[0.06]"
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

export function EditProfileForm() {
  const { user, ready } = useAuthSession();

  if (!ready) {
    return (
      <GlassCard className="p-10 text-center text-sm text-white/55">
        Loading…
      </GlassCard>
    );
  }

  if (!user) {
    return (
      <GlassCard className="space-y-4 p-8 text-center">
        <p className="text-white/80">Sign in to edit your profile.</p>
        <TextLink href="/">← Back to home</TextLink>
      </GlassCard>
    );
  }

  return <ProfileFieldsForm key={user.id} user={user} />;
}
