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
import { refreshAuthSessionSnapshot, useAuthSession } from "@/src/hooks/useAuthSession";
import { getAuthEmailRedirectTo } from "@/src/lib/authUi";

function readMetaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v : "";
}

const BIO_MAX = 280;
const AVATAR_BUCKET = "profile-photos";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const BANNER_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function ProfileFieldsForm({ user }: { user: User }) {
  const router = useRouter();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const [fullName, setFullName] = useState(() => readMetaString(meta, "full_name"));
  const [displayName, setDisplayName] = useState(() =>
    readMetaString(meta, "display_name"),
  );
  const [bio, setBio] = useState(() => readMetaString(meta, "bio"));
  const [email, setEmail] = useState(() => user.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => readMetaString(meta, "avatar_url"));
  const [bannerUrl, setBannerUrl] = useState(() => readMetaString(meta, "banner_url"));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const avatarPreviewRef = useRef("");
  const bannerPreviewRef = useRef("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
      if (bannerPreviewRef.current) {
        URL.revokeObjectURL(bannerPreviewRef.current);
      }
    },
    [],
  );

  function handleImageChange(
    ev: React.ChangeEvent<HTMLInputElement>,
    options: {
      label: "profile photo" | "profile banner";
      maxBytes: number;
      previewRef: React.MutableRefObject<string>;
      setPreview: (value: string) => void;
      setFile: (value: File | null) => void;
    },
  ) {
    const file = ev.target.files?.[0];
    setError(null);
    setNotice(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError(`Use a JPG, PNG, or WebP image for your ${options.label}.`);
      ev.target.value = "";
      return;
    }
    if (file.size > options.maxBytes) {
      const mb = Math.round(options.maxBytes / 1024 / 1024);
      setError(`${options.label === "profile banner" ? "Profile banners" : "Profile photos"} must be ${mb} MB or smaller.`);
      ev.target.value = "";
      return;
    }
    if (options.previewRef.current) {
      URL.revokeObjectURL(options.previewRef.current);
    }
    const nextPreview = URL.createObjectURL(file);
    options.previewRef.current = nextPreview;
    options.setPreview(nextPreview);
    options.setFile(file);
  }

  function handleBannerChange(ev: React.ChangeEvent<HTMLInputElement>) {
    handleImageChange(ev, {
      label: "profile banner",
      maxBytes: BANNER_MAX_BYTES,
      previewRef: bannerPreviewRef,
      setPreview: setBannerPreview,
      setFile: setBannerFile,
    });
  }

  function handleAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    handleImageChange(ev, {
      label: "profile photo",
      maxBytes: AVATAR_MAX_BYTES,
      previewRef: avatarPreviewRef,
      setPreview: setAvatarPreview,
      setFile: setAvatarFile,
    });
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

  function removeBanner() {
    if (bannerPreviewRef.current) {
      URL.revokeObjectURL(bannerPreviewRef.current);
      bannerPreviewRef.current = "";
    }
    setBannerFile(null);
    setBannerPreview("");
    setBannerUrl("");
  }

  async function uploadProfileImageIfNeeded(
    file: File | null,
    currentUrl: string,
    name: "avatar" | "banner",
  ): Promise<string> {
    if (!file) return currentUrl.trim();
    const path = `${user.id}/${name}.${fileExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadAvatarIfNeeded(): Promise<string> {
    return uploadProfileImageIfNeeded(avatarFile, avatarUrl, "avatar");
  }

  async function uploadBannerIfNeeded(): Promise<string> {
    return uploadProfileImageIfNeeded(bannerFile, bannerUrl, "banner");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded();
      const nextBannerUrl = await uploadBannerIfNeeded();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: nextAvatarUrl,
          banner_url: nextBannerUrl,
        },
      });
      if (updateError) throw updateError;

      const nextEmail = email.trim();
      const currentEmail = user.email?.trim() ?? "";
      if (nextEmail && nextEmail !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: nextEmail },
          { emailRedirectTo: getAuthEmailRedirectTo() },
        );
        if (emailError) throw emailError;
        setNotice(
          "Profile saved. Check your inbox to confirm the email change before using the new address to sign in.",
        );
        await refreshAuthSessionSnapshot();
        return;
      }

      await refreshAuthSessionSnapshot();
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
        <div className="rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4">
          <label htmlFor="banner" className={labelClass}>
            Profile banner
          </label>
          <div
            className="mt-3 h-28 rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14] bg-cover bg-center"
            style={
              bannerPreview || bannerUrl
                ? { backgroundImage: `url(${bannerPreview || bannerUrl})` }
                : undefined
            }
            aria-hidden
          />
          <input
            id="banner"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleBannerChange}
            className="mt-3 block w-full cursor-pointer text-xs text-white/55 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/12 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-200 hover:file:bg-emerald-500/18"
          />
          <p className="mt-1.5 text-xs leading-relaxed text-white/40">
            Optional. JPG, PNG, or WebP under 4 MB.
          </p>
          {bannerPreview || bannerUrl ? (
            <button
              type="button"
              onClick={removeBanner}
              className="mt-2 text-xs font-medium text-white/50 underline-offset-2 transition hover:text-emerald-300 hover:underline"
            >
              Remove banner
            </button>
          ) : null}
        </div>

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
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className={inputClass}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-white/45">
            Email changes use Supabase Auth confirmation. You may need to confirm
            the new address before it becomes active.
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
        {notice ? (
          <p className="text-sm leading-relaxed text-emerald-300/90" role="status">
            {notice}
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
  const { user, ready } = useAuthSession({ skipInitialLoading: true });

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
