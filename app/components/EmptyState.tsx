import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <GlassCard
      className={[
        "flex flex-col items-center py-14 text-center sm:py-16",
        className,
      ].join(" ")}
    >
      {icon ? (
        <div className="text-5xl leading-none opacity-95" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/70">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </GlassCard>
  );
}
