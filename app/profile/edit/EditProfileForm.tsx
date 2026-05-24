"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar } from "../../components/Avatar";
import { GlassCard } from "../../components/GlassCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { PageLoading } from "../../components/ui/LoadingStates";
import { TextLink } from "../../components/TextLink";
import { UploadProgress } from "../../components/ui/UploadProgress";
import { inputClass, labelClass } from "../../components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { refreshAuthSessionSnapshot, useAuthSession } from "@/src/hooks/useAuthSession";
import { getAuthEmailRedirectTo } from "@/src/lib/authUi";
import {
  formatBytes,
  optimizeProfileImage,
  type ProfileImageVariant,
} from "@/src/lib/imageOptimize";
import {
  storageErrorMessage,
  uploadProfileImageToStorage,
} from "@/src/lib/storage";

function readMetaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v : "";
}

const BIO_MAX = 280;

type ImageFieldState = {
  file: File | null;
  preview: string;
  savedUrl: string;
  processing: boolean;
  optimizeNote: string | null;
};

function emptyImageState(savedUrl = ""): ImageFieldState {
  return {
    file: null,
    preview: "",
    savedUrl,
    processing: false,
    optimizeNote: null,
  };
}

function revokePreview(preview: string) {
  if (preview.startsWith("blob:")) {
    URL.revokeObjectURL(preview);
  }
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
  const [avatar, setAvatar] = useState<ImageFieldState>(() =>
    emptyImageState(readMetaString(meta, "avatar_url")),
  );
  const [banner, setBanner] = useState<ImageFieldState>(() =>
    emptyImageState(readMetaString(meta, "banner_url")),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveProgressLabel, setSaveProgressLabel] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      revokePreview(avatar.preview);
      revokePreview(banner.preview);
    },
    [avatar.preview, banner.preview],
  );

  function setSavePhase(label: string, value: number) {
    setSaveProgressLabel(label);
    setSaveProgress(value);
  }

  async function handleImagePick(
    file: File | undefined,
    variant: ProfileImageVariant,
    input: HTMLInputElement | null,
  ) {
    setError(null);
    setNotice(null);
    if (!file) return;

    const setState = variant === "avatar" ? setAvatar : setBanner;
    setState((current) => {
      revokePreview(current.preview);
      return {
        ...current,
        file: null,
        preview: "",
        processing: true,
        optimizeNote: null,
      };
    });

    try {
      const optimized = await optimizeProfileImage(file, variant);
      setState((current) => ({
        ...current,
        file: optimized.file,
        preview: optimized.previewUrl,
        processing: false,
        optimizeNote: `Optimized to ${optimized.width}×${optimized.height} ${optimized.format.toUpperCase()} (${formatBytes(optimized.originalBytes)} → ${formatBytes(optimized.optimizedBytes)})`,
      }));
    } catch (err: unknown) {
      setState((current) => ({
        ...current,
        processing: false,
        optimizeNote: null,
      }));
      if (input) input.value = "";
      setError(
        err instanceof Error
          ? err.message
          : `Could not prepare your ${variant === "avatar" ? "profile photo" : "banner"}.`,
      );
    }
  }

  function removeImage(variant: ProfileImageVariant) {
    const setState = variant === "avatar" ? setAvatar : setBanner;
    const input = variant === "avatar" ? avatarInputRef : bannerInputRef;
    setState((current) => {
      revokePreview(current.preview);
      return emptyImageState("");
    });
    if (input.current) input.current.value = "";
    setError(null);
    setNotice(null);
  }

  async function uploadProfileImage(
    state: ImageFieldState,
    variant: ProfileImageVariant,
    onProgress: (value: number) => void,
  ): Promise<string> {
    if (!state.file) {
      return state.savedUrl.trim();
    }

    onProgress(20);
    try {
      const url = await uploadProfileImageToStorage(user.id, variant, state.file);
      onProgress(100);
      return url;
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error(storageErrorMessage(err, "upload"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (avatar.processing || banner.processing) {
      setError("Please wait for image optimization to finish.");
      return;
    }

    setError(null);
    setNotice(null);
    setSaving(true);
    setSaveProgress(0);

    try {
      setSavePhase("Uploading profile photo…", 5);
      const nextAvatarUrl = await uploadProfileImage(avatar, "avatar", (value) => {
        setSavePhase("Uploading profile photo…", 5 + Math.round(value * 0.25));
      });

      setSavePhase("Uploading profile banner…", 35);
      const nextBannerUrl = await uploadProfileImage(banner, "banner", (value) => {
        setSavePhase("Uploading profile banner…", 35 + Math.round(value * 0.25));
      });

      setSavePhase("Saving profile…", 70);
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
        setSavePhase("Sending email confirmation…", 90);
        const { error: emailError } = await supabase.auth.updateUser(
          { email: nextEmail },
          { emailRedirectTo: getAuthEmailRedirectTo() },
        );
        if (emailError) throw emailError;
        await refreshAuthSessionSnapshot();
        setSavePhase("Done", 100);
        setNotice(
          "Profile saved. Check your inbox to confirm the email change before using the new address to sign in.",
        );
        setAvatar((current) => ({
          ...current,
          savedUrl: nextAvatarUrl,
          file: null,
        }));
        setBanner((current) => ({
          ...current,
          savedUrl: nextBannerUrl,
          file: null,
        }));
        return;
      }

      setSavePhase("Refreshing session…", 92);
      await refreshAuthSessionSnapshot();
      setSavePhase("Done", 100);
      setNotice("Profile saved successfully.");
      router.push("/profile");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : storageErrorMessage(err, "upload");
      setError(
        message.includes("profile") || message.includes("image") || message.includes("session")
          ? message
          : `Could not save profile. ${message}`,
      );
      setSaveProgress(0);
      setSaveProgressLabel("");
    } finally {
      setSaving(false);
    }
  }

  const avatarDisplay = avatar.preview || avatar.savedUrl;
  const bannerDisplay = banner.preview || banner.savedUrl;
  const fileInputClass =
    "mt-3 block w-full min-h-[2.75rem] cursor-pointer touch-manipulation text-xs text-white/55 file:mr-3 file:min-h-[2.5rem] file:rounded-lg file:border-0 file:bg-emerald-500/12 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-emerald-200 hover:file:bg-emerald-500/18";

  return (
    <GlassCard className="p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Edit profile
        </h1>
        <TextLink href="/profile" className="shrink-0 self-start sm:self-auto">
          ← Back to profile
        </TextLink>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4">
          <label htmlFor="banner" className={labelClass}>
            Profile banner
          </label>
          <div
            className="mt-3 h-28 w-full rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14] bg-cover bg-center"
            style={
              bannerDisplay
                ? { backgroundImage: `url(${bannerDisplay})` }
                : undefined
            }
            aria-hidden
          />
          <input
            ref={bannerInputRef}
            id="banner"
            type="file"
            accept="image/*"
            disabled={saving || banner.processing}
            onChange={(ev) => {
              void handleImagePick(ev.target.files?.[0], "banner", ev.target);
            }}
            className={fileInputClass}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-white/40">
            Optional. Large photos are automatically resized and optimized for you.
          </p>
          {banner.processing ? (
            <p className="mt-2 text-xs text-emerald-300/85" role="status">
              Optimizing banner…
            </p>
          ) : null}
          {banner.optimizeNote ? (
            <p className="mt-2 text-xs leading-relaxed text-white/45" role="status">
              {banner.optimizeNote}
            </p>
          ) : null}
          {bannerDisplay ? (
            <button
              type="button"
              onClick={() => removeImage("banner")}
              disabled={saving || banner.processing}
              className="mt-3 min-h-[2.75rem] touch-manipulation text-xs font-medium text-white/50 underline-offset-2 transition hover:text-emerald-300 hover:underline disabled:opacity-50"
            >
              Remove banner
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4 sm:flex-row sm:items-start">
          <Avatar
            user={user}
            src={avatarDisplay}
            label={displayName || fullName || user.email}
            size="md"
            className="mx-auto sm:mx-0"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor="avatar" className={labelClass}>
              Profile photo
            </label>
            <input
              ref={avatarInputRef}
              id="avatar"
              type="file"
              accept="image/*"
              disabled={saving || avatar.processing}
              onChange={(ev) => {
                void handleImagePick(ev.target.files?.[0], "avatar", ev.target);
              }}
              className={fileInputClass}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-white/40">
              Optional. Photos are auto-optimized. Initials show when no photo is set.
            </p>
            {avatar.processing ? (
              <p className="mt-2 text-xs text-emerald-300/85" role="status">
                Optimizing photo…
              </p>
            ) : null}
            {avatar.optimizeNote ? (
              <p className="mt-2 text-xs leading-relaxed text-white/45" role="status">
                {avatar.optimizeNote}
              </p>
            ) : null}
            {avatarDisplay ? (
              <button
                type="button"
                onClick={() => removeImage("avatar")}
                disabled={saving || avatar.processing}
                className="mt-3 min-h-[2.75rem] touch-manipulation text-xs font-medium text-white/50 underline-offset-2 transition hover:text-emerald-300 hover:underline disabled:opacity-50"
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
            disabled={saving}
          />
          <p className="mt-1 text-xs leading-relaxed text-white/45">
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
            className={`${inputClass} min-h-[6rem] resize-y`}
            placeholder="A short line about you…"
          />
          <p className="mt-1.5 text-right text-xs tabular-nums text-white/40">
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        {saving && saveProgressLabel ? (
          <UploadProgress value={saveProgress} label={saveProgressLabel} />
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200/95" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm leading-relaxed text-emerald-200/95" role="status">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end sm:gap-3">
          <ButtonLink
            href="/profile"
            variant="secondary"
            size="md"
            fullWidth
            className="min-h-11 touch-manipulation sm:w-auto sm:min-w-[7.5rem]"
          >
            Cancel
          </ButtonLink>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            disabled={saving || avatar.processing || banner.processing}
            fullWidth
            className="min-h-11 touch-manipulation sm:w-auto sm:min-w-[9rem]"
          >
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
      <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-0">
        <PageLoading message="Loading profile…" />
      </div>
    );
  }

  if (!user) {
    return (
      <GlassCard className="mx-4 space-y-4 p-8 text-center sm:mx-0">
        <p className="text-white/80">Sign in to edit your profile.</p>
        <TextLink href="/">← Back to home</TextLink>
      </GlassCard>
    );
  }

  return <ProfileFieldsForm key={user.id} user={user} />;
}
