import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

export function GlassCard({
  children,
  className = "",
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-white/[0.07] bg-[#111827]/85 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl backdrop-saturate-150",
        "ring-1 ring-inset ring-white/[0.04] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
