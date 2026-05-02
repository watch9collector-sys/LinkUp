import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type LegalCenterCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function LegalCenterCard({
  title,
  description,
  children,
}: LegalCenterCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl justify-center py-2 sm:py-6">
      <GlassCard as="article" className="w-full border-emerald-500/10 px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-center text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-[15px] leading-relaxed text-white/72">
          {description}
        </p>
        {children ? (
          <div className="mt-8 border-t border-emerald-500/10 pt-8 text-sm leading-relaxed text-white/78">
            {children}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
