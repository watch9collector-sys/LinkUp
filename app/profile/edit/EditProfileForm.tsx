"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar } from "../../components/Avatar";
import { GlassCard } from "../../components/GlassCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { PageLoading } from "../../components/ui/LoadingStates";
import { TextLink } from "../../components/TextLink";
import { inputClass, labelClass } from "../../components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { useAuthSession } from "@/src/hooks/useAuthSession";

function readMetaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v : "";
}

const BIO_MAX = 280;
const AVATAR_BUCKET = "profile-photos";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ProfileFieldsForm({ user }: { user: User }) {
  const router = useRouter();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const [fullName, setFullName] = useState(() => readMetaString(meta, "full_name"));
  const [displayName, setDisplayName] = useState(() =>
    readMetaString(meta, "display_name"),
  );
  const [bio, setBio] = useState(() => readMetaString(meta, "bio"));
  const [avatarUrl, setAvatarUrl] = useState(() => readMetaString(meta, "avatar_url"));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarPreviewRef = useRef("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    },
    [],
  );

  function handleAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image for your profile photo.");
      ev.target.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("Profile photos must be 2 MB or smaller.");
      ev.target.value = "";
      return;
    }
    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(avatarPreviewRef.current);
    }
    const nextPreview = URL.createObjectURL(file);
    avatarPreviewRef.current = nextPreview;
    setAvatarPreview(nextPreview);
    setAvatarFile(file);
  }

  function removeAvatar() {
    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(avatarPreviewRef.current);
      avatarPreviewRef.current = "";
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarUrl("");
  }

  async function uploadAvatarIfNeeded(): Promise<string> {
    if (!avatarFile) return avatarUrl.trim();
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, avatarFile, {
        cacheControl: "3600",
        contentType: avatarFile.type,
        upsert: true,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: nextAvatarUrl,
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
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4">
          <Avatar
            user={user}
            src={avatarPreview || avatarUrl}
            label={displayName || fullName || user.email}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor="avatar" className={labelClass}>
              Profile photo
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="mt-2 block w-full cursor-pointer text-xs text-white/55 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/12 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-200 hover:file:bg-emerald-500/18"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-white/40">
              Optional. JPG, PNG, or WebP under 2 MB. Initials stay as fallback.
            </p>
            {avatarPreview || avatarUrl ? (
              <button
                type="button"
                onClick={removeAvatar}
                className="mt-2 text-xs font-medium text-white/50 underline-offset-2 transition hover:text-emerald-300 hover:underline"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>

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
            maxLength={BIO_MAX}
            className={`${inputClass} resize-y min-h-[6rem]`}
            placeholder="A short line about you…"
          />
          <p className="mt-1.5 text-right text-xs tabular-nums text-white/40">
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-400/95" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end sm:gap-3">
          <ButtonLink href="/profile" variant="secondary" size="md" fullWidth className="sm:w-auto sm:min-w-[7.5rem]">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" size="md" loading={saving} fullWidth className="sm:w-auto sm:min-w-[9rem]">
            Save changes
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
      <div className="mx-auto w-full max-w-xl py-6">
        <PageLoading message="Loading profile…" />
      </div>
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
