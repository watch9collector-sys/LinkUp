"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/shoutouts", label: "Shoutouts" },
  { href: "/profile", label: "Profile" },
  { href: "/contact", label: "Contact" },
] as const;

function navClass(active: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-colors",
    active
      ? "border border-emerald-500/25 bg-emerald-500/12 text-emerald-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      : "border border-transparent text-white/72 hover:border-white/[0.06] hover:bg-white/[0.06] hover:text-white",
  ].join(" ");
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0F14]/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
        >
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight text-white">
            LinkUp
          </span>
        </Link>
        <nav
          className="flex flex-wrap items-center gap-1 sm:gap-1.5"
          aria-label="Main"
        >
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={navClass(active)}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
