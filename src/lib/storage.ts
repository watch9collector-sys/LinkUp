import { supabase } from "@/src/lib/supabase";

/**
 * Supabase Storage bucket for profile avatars and banners.
 * Paths: `{userId}/avatar.webp`, `{userId}/banner.webp`
 */
export const PROFILE_IMAGES_BUCKET = "profile-images";

export type ProfileStorageVariant = "avatar" | "banner";

export function profileImageObjectPath(
  userId: string,
  variant: ProfileStorageVariant,
  extension: string,
) {
  const ext = extension.replace(/^\./, "").toLowerCase() || "webp";
  return `${userId}/${variant}.${ext}`;
}

function lowerStorageError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message).toLowerCase();
  }
  return "";
}

function storageErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "error" in err) {
    const nested = (err as { error?: string }).error;
    if (typeof nested === "string") return nested.toLowerCase();
  }
  if (err && typeof err === "object" && "statusCode" in err) {
    return String((err as { statusCode?: string | number }).statusCode);
  }
  return "";
}

/**
 * Maps Supabase Storage API errors to user-safe copy.
 */
export function storageErrorMessage(
  err: unknown,
  context: "upload" | "read" = "upload",
): string {
  const message = lowerStorageError(err);
  const code = storageErrorCode(err);

  if (
    message.includes("bucket not found") ||
    code === "404" ||
    message.includes("does not exist")
  ) {
    return context === "upload"
      ? `Profile image storage bucket "${PROFILE_IMAGES_BUCKET}" was not found. Confirm it exists in Supabase Storage and matches the app configuration.`
      : "Profile images are temporarily unavailable.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("policy") ||
    message.includes("not authorized") ||
    message.includes("permission")
  ) {
    return "You do not have permission to update this image. Apply storage policies in Supabase, then sign out and sign in again.";
  }

  if (
    message.includes("jwt") ||
    message.includes("session") ||
    message.includes("not authenticated")
  ) {
    return "Your session expired. Sign in again, then retry your upload.";
  }

  if (
    message.includes("too large") ||
    message.includes("payload") ||
    message.includes("entity too large") ||
    code === "413"
  ) {
    return "This image is still too large to upload. Try a different photo or a smaller file.";
  }

  if (message.includes("mime") || message.includes("content type")) {
    return "This file type is not supported. Use a JPG, PNG, or WebP photo.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error while uploading. Check your connection and try again.";
  }

  if (err instanceof Error && err.message && !err.message.toLowerCase().includes("bucket")) {
    return err.message;
  }

  return context === "upload"
    ? "Could not upload your image. Please try again."
    : "Could not load profile images.";
}

/** Remove all stored files for one profile variant (avatar or banner). */
export async function deleteProfileVariantFromStorage(
  userId: string,
  variant: ProfileStorageVariant,
): Promise<void> {
  const folder = userId;
  const { data: files, error: listError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .list(folder, { limit: 100 });

  if (listError || !files?.length) return;

  const prefix = `${variant}.`;
  const paths = files
    .filter((file) => file.name?.startsWith(prefix))
    .map((file) => `${folder}/${file.name}`);

  if (!paths.length) return;

  const { error: removeError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .remove(paths);

  if (removeError) {
    throw new Error(storageErrorMessage(removeError, "upload"));
  }
}

export async function uploadProfileImageToStorage(
  userId: string,
  variant: ProfileStorageVariant,
  file: File,
): Promise<string> {
  await deleteProfileVariantFromStorage(userId, variant);

  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const path = profileImageObjectPath(userId, variant, extension);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(storageErrorMessage(uploadError, "upload"));
  }

  const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Could not generate a public URL for your profile image.");
  }

  const base = data.publicUrl.split("?")[0] ?? data.publicUrl;
  return `${base}?v=${Date.now()}`;
}

export async function checkProfileImagesBucketReachable(): Promise<{
  ok: boolean;
  message: string;
}> {
  const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).list("", {
    limit: 1,
  });

  if (!error) {
    return { ok: true, message: `Bucket "${PROFILE_IMAGES_BUCKET}" is reachable.` };
  }

  return {
    ok: false,
    message: storageErrorMessage(error, "read"),
  };
}
