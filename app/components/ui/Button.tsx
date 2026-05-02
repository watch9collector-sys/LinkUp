import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14] disabled:pointer-events-none disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#16A34A] text-white shadow-[0_0_28px_rgba(34,197,94,0.35)] ring-1 ring-emerald-300/25 hover:from-[#6EE7B7] hover:via-[#34D399] hover:to-[#22C55E] hover:shadow-[0_0_36px_rgba(52,211,153,0.45)] active:translate-y-px",
  secondary:
    "bg-[#0F172A]/90 text-white/95 ring-1 ring-white/[0.08] shadow-md shadow-black/30 hover:bg-[#1e293b]/95 hover:ring-emerald-500/25",
  danger:
    "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-950/40 ring-1 ring-white/15 hover:from-red-400 hover:to-red-600 active:translate-y-px",
  ghost:
    "text-emerald-400/95 hover:bg-emerald-500/10 hover:text-emerald-300",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth?: boolean,
) {
  return [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[buttonClasses(variant, size, fullWidth), className].join(
        " ",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
