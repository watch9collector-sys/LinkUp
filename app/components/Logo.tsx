import type { ReactNode } from "react";

/** Brand neon used in chrome (unchanged from MVP). */
export const LINKUP_BRAND_FG = "#00FF9C";

type LogoMarkProps = {
  className?: string;
  /** Navbar default `sm`; `lg` for auth / splash. */
  size?: "sm" | "md" | "lg";
};

/**
 * Nyvon mark — exact supplied logo asset.
 * Container sizing/chrome matches the previous LogoMark so layout does not shift.
 */
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
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-black ring-1 ring-[#00FF9C]/30 shadow-[0_0_20px_rgba(0,255,156,0.2)]",
        outer,
        className,
      ].join(" ")}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nyvon-logo.png"
        alt=""
        width={Math.round(px * 0.92)}
        height={Math.round(px * 0.92)}
        className="h-[72%] w-[72%] object-contain"
        draggable={false}
      />
    </span>
  );
}

/** Centered splash: mark + Nyvon word (auth screen hero). */
export function AuthHeroBrand({
  eyebrowWordmark = false,
}: {
  /** When true, show “Nyvon” text under logo (recommended on dark auth surfaces). */
  eyebrowWordmark?: boolean;
}) {
  const word: ReactNode = eyebrowWordmark ? (
    <p className="mt-4 text-xl font-semibold tracking-tight text-[#00FF9C]/95">
      Nyvon
    </p>
  ) : null;

  return (
    <div className="flex flex-col items-center text-center">
      <LogoMark size="lg" />
      {word}
    </div>
  );
}
