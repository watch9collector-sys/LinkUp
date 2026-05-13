import Link from "next/link";
import type { ComponentProps } from "react";

const linkClass =
  "inline-flex touch-manipulation items-center rounded-lg text-sm font-medium text-emerald-400/95 transition-colors duration-200 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]";

export function TextLink({ className = "", ...rest }: ComponentProps<typeof Link>) {
  return <Link className={[linkClass, className].join(" ")} {...rest} />;
}
