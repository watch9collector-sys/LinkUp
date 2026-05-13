import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-[transform,box-shadow,background-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14] disabled:pointer-events-none disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#16A34A] text-white shadow-[0_0_28px_rgba(34,197,94,0.35)] ring-1 ring-emerald-300/25 hover:from-[#6EE7B7] hover:via-[#34D399] hover:to-[#22C55E] hover:shadow-[0_0_36px_rgba(52,211,153,0.45)] active:translate-y-px",
  secondary:
    "bg-[#0F172A]/90 text-white/95 ring-1 ring-white/[0.08] shadow-md shadow-black/30 hover:bg-[#1e293b]/95 hover:ring-emerald-500/25 active:translate-y-px",
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
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const spinnerSize: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4 w-4",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  className = "",
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const busy = Boolean(loading);
  return (
    <button
      type={type}
      className={[buttonClasses(variant, size, fullWidth), className].join(
        " ",
      )}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? (
        <Spinner
          className={[
            spinnerSize[size],
            variant === "primary" || variant === "danger"
              ? "text-white"
              : variant === "ghost"
                ? "text-emerald-400"
                : "text-emerald-300/90",
          ].join(" ")}
        />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "className"> & { className?: string };

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={[buttonClasses(variant, size, fullWidth), className].join(" ")}
      {...rest}
    >
      {children}
    </Link>
  );
}
