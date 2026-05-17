"use client";

import Image from "next/image";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getInitials } from "@/src/lib/userDisplay";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-20 w-20 text-sm",
};

function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (
    parts
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "LU"
  );
}

export function Avatar({
  label,
  user,
  src,
  size = "sm",
  className = "",
}: {
  label?: string;
  user?: User;
  src?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc =
    src ||
    (typeof (user?.user_metadata as Record<string, unknown> | undefined)
      ?.avatar_url === "string"
      ? ((user?.user_metadata as Record<string, unknown>).avatar_url as string)
      : "");
  const initials = user
    ? getInitials(user)
    : label
      ? initialsFromName(label)
      : "LU";

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-400/20 bg-[#0B0F14] font-semibold tracking-wide text-emerald-200 shadow-[0_0_14px_rgba(34,197,94,0.1)] ring-1 ring-white/[0.06]",
        "before:absolute before:inset-1 before:rounded-full before:bg-gradient-to-br before:from-emerald-400/16 before:to-transparent before:content-['']",
        sizeClasses[size],
        className,
      ].join(" ")}
      aria-hidden
      title={label}
    >
      {imageSrc && !imageFailed ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes={size === "lg" ? "80px" : size === "md" ? "44px" : "36px"}
          unoptimized
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="relative z-10">{initials}</span>
      )}
    </div>
  );
}
