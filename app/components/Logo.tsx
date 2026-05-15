import type { ReactNode } from "react";

/** Official brand neon for SVG strokes (matches MVP identity). */
export const LINKUP_BRAND_FG = "#00FF9C";

type IconPinLinkProps = {
  size: number;
  className?: string;
};

/** Map pin with chain-link motif — scalable line art for chrome + exports. */
function IconPinLink({ size, className }: IconPinLinkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 21.2c-.32 0-.62-.15-.84-.4C9.7 18.5 4.75 12.4 4.75 8.25a7.25 7.25 0 1 1 14.5 0c0 4.15-4.95 10.25-6.41 12.55a1.05 1.05 0 0 1-.84.4Z"
        fill="#0B0F14"
        stroke={LINKUP_BRAND_FG}
        strokeWidth={1.45}
        strokeLinejoin="round"
      />
      <g
        transform="translate(12 11) scale(0.46) translate(-12 -12)"
        fill="none"
        stroke={LINKUP_BRAND_FG}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <path d="M9 17H7a5 5 0 010-10h2" />
        <path d="M15 7h2a5 5 0 110 10h-2" />
        <path d="M8 12h8" />
      </g>
    </svg>
  );
}

type LogoMarkProps = {
  className?: string;
  /** Navbar default `sm`; `lg` for auth / splash. */
  size?: "sm" | "md" | "lg";
};

export function LogoMark({ className = "", size = "sm" }: LogoMarkProps) {
  const px = size === "lg" ? 36 : size === "md" ? 28 : 22;
  const outer =
    size === "lg"
      ? "h-14 w-14 rounded-2xl"
      : size === "md"
        ? "h-11 w-11 rounded-xl"
        : "h-9 w-9 rounded-xl";

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center bg-black ring-1 ring-[#00FF9C]/30 shadow-[0_0_20px_rgba(0,255,156,0.2)]",
        outer,
        className,
      ].join(" ")}
      aria-hidden
    >
      <IconPinLink size={Math.round(px * 0.72)} />
    </span>
  );
}

/** Centered splash: mark + LinkUp word (auth screen hero). */
export function AuthHeroBrand({
  eyebrowWordmark = false,
}: {
  /** When true, show “LinkUp” text under logo (recommended on dark auth surfaces). */
  eyebrowWordmark?: boolean;
}) {
  const word: ReactNode = eyebrowWordmark ? (
    <p className="mt-4 text-xl font-semibold tracking-tight text-[#00FF9C]/95">
      LinkUp
    </p>
  ) : null;

  return (
    <div className="flex flex-col items-center text-center">
      <LogoMark size="lg" />
      {word}
    </div>
  );
}
