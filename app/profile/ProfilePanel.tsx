"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { buttonClasses } from "../components/ui/Button";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { getDisplayName, getInitials } from "@/src/lib/userDisplay";

const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/safety", label: "Child safety" },
  { href: "/delete", label: "Delete account" },
  { href: "/admin", label: "Admin" },
] as const;

export function ProfilePanel() {
  const { user, ready } = useAuthSession();
  const [ghostMode, setGhostMode] = useState(false);

  if (!ready) {
    return (
      <div className="mx-auto flex w-full max-w-xl justify-center py-16 text-sm text-white/50">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <GlassCard className="mx-auto max-w-xl space-y-4 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Profile</h1>
        <p className="text-[15px] text-white/60">
          Sign in from Home to manage your account.
        </p>
        <Link
          href="/"
          className={buttonClasses("primary", "md", false) + " inline-flex"}
        >
          Go to Home
        </Link>
      </GlassCard>
    );
  }

  const name = getDisplayName(user);
  const initials = getInitials(user);
  const email = user.email ?? "";
  const bio =
    typeof (user.user_metadata as Record<string, unknown>).bio === "string"
      ? ((user.user_metadata as Record<string, unknown>).bio as string)
      : "";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <GlassCard className="overflow-hidden border-white/[0.06] p-0">
        <div className="h-28 bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14]" />
        <div className="-mt-12 flex flex-col items-center px-6 pb-6 pt-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-[#0B0F14] text-sm font-semibold tracking-wide text-emerald-300 ring-1 ring-white/[0.06]">
            {initials}
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
            {name}
          </h1>
          <p className="mt-1 text-sm text-white/55">{email}</p>
          {bio.trim() ? (
            <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-white/55">
              {bio}
            </p>
          ) : null}
          <Link
            href="/profile/edit"
            className={[buttonClasses("secondary", "md", false), "mt-5"].join(" ")}
          >
            Edit profile
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="border-white/[0.06]">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white/40">
          Visibility
        </h2>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#0B0F14]/35 px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-white">Ghost mode</p>
            <p className="text-xs text-white/50">Hide from nearby discovery</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ghostMode}
            onClick={() => setGhostMode((v) => !v)}
            className={[
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              ghostMode
                ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.35)]"
                : "bg-white/12",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform",
                ghostMode ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="border-white/[0.06]">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white/40">
          Support & legal
        </h2>
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[#0B0F14]/30">
          {legalLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-medium text-white/85 transition hover:bg-white/[0.04]"
              >
                <span>{label}</span>
                <span className="text-white/30" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
