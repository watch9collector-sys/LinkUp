export type ProfileImageVariant = "avatar" | "banner";

export type OptimizedProfileImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
  format: "webp" | "jpeg";
};

const VARIANT_LIMITS: Record<
  ProfileImageVariant,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  avatar: { maxWidth: 512, maxHeight: 512, quality: 0.86 },
  banner: { maxWidth: 1600, maxHeight: 512, quality: 0.82 },
};

const ACCEPTED_INPUT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try another photo."));
    };
    image.src = url;
  });
}

function canvasSupportsWebp() {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not optimize this image."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function isAcceptedProfileImage(file: File) {
  if (ACCEPTED_INPUT_TYPES.has(file.type)) return true;
  return file.type.startsWith("image/");
}

export async function optimizeProfileImage(
  file: File,
  variant: ProfileImageVariant,
): Promise<OptimizedProfileImage> {
  if (!isAcceptedProfileImage(file)) {
    throw new Error("Use a photo file (JPG, PNG, WebP, or HEIC).");
  }

  const image = await loadImageElement(file);
  const limits = VARIANT_LIMITS[variant];
  const { width, height } = fitWithin(
    image.naturalWidth,
    image.naturalHeight,
    limits.maxWidth,
    limits.maxHeight,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image optimization is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  const useWebp = canvasSupportsWebp();
  const mimeType = useWebp ? "image/webp" : "image/jpeg";
  const extension = useWebp ? "webp" : "jpg";
  const blob = await canvasToBlob(canvas, mimeType, limits.quality);
  const optimizedFile = new File([blob], `${variant}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file: optimizedFile,
    previewUrl: URL.createObjectURL(optimizedFile),
    width,
    height,
    originalBytes: file.size,
    optimizedBytes: optimizedFile.size,
    format: useWebp ? "webp" : "jpeg",
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function withCacheBust(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const base = trimmed.split("?")[0] ?? trimmed;
  return `${base}?v=${Date.now()}`;
}
