import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Short onboarding tips (Profile-style list rhythm). */
  hints?: readonly string[];
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  hints,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <GlassCard
      className={[
        "flex flex-col items-center px-4 py-12 text-center transition-[box-shadow,border-color] duration-300 ease-out sm:px-8 sm:py-14",
        "hover:border-white/[0.09] motion-reduce:transition-none",
        className,
      ].join(" ")}
    >
      {icon ? (
        <div className="text-5xl leading-none opacity-95" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2
        className={`text-lg font-semibold tracking-tight text-white text-balance sm:text-xl ${icon ? "mt-4" : ""}`}
      >
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-pretty text-[15px] leading-relaxed text-white/65">
          {description}
        </p>
      ) : null}
      {hints && hints.length > 0 ? (
        <div className="mt-6 w-full max-w-lg text-left">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/38">
            Next steps
          </p>
          <ul className="mt-3 space-y-2.5 rounded-xl border border-white/[0.06] bg-[#0B0F14]/35 px-4 py-3.5">
            {hints.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-snug text-white/70">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/85"
                  aria-hidden
                />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {action ? <div className="mt-8 w-full max-w-xs sm:max-w-none">{action}</div> : null}
    </GlassCard>
  );
}
