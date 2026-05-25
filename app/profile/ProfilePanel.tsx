"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "../components/Avatar";
import { GlassCard } from "../components/GlassCard";
import { buttonClasses } from "../components/ui/Button";
import { PageLoading } from "../components/ui/LoadingStates";
import { sectionEyebrowClass } from "../components/ui/styles";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { getDisplayName } from "@/src/lib/userDisplay";

const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/child-safety", label: "Child safety" },
  { href: "/delete", label: "Delete account" },
] as const;

export function ProfilePanel() {
  const { session, user, ready } = useAuthSession({ skipInitialLoading: true });
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[LinkUp] profile auth state", {
        ready,
        hasSession: Boolean(session),
        hasUser: Boolean(user),
        userId: user?.id ?? null,
        note: "Profile uses Supabase Auth user metadata; no separate profile table fetch runs here.",
      });
    }
  }, [ready, session, user]);

  if (!ready) {
    return <PageLoading message="Loading profile…" />;
  }

  if (!user) {
    return (
      <GlassCard className="mx-auto max-w-xl space-y-4 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Profile</h1>
        <p className="text-[15px] text-white/60">
          Sign in from Home to manage your account.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <div className="rounded-xl border border-emerald-500/15 bg-[#06120c]/70 px-4 py-3 text-left text-[11px] leading-relaxed text-white/55">
            <p className="font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              Profile auth debug
            </p>
            <p className="mt-2">ready={String(ready)}</p>
            <p>session={session ? "present" : "missing"}</p>
            <p>user={user ? "present" : "missing"}</p>
            <p>No separate profile table fetch runs on this page.</p>
          </div>
        ) : null}
        <Link
          href="/"
          className={buttonClasses("primary", "md", false) + " inline-flex touch-manipulation justify-center"}
        >
          Go to Home
        </Link>
      </GlassCard>
    );
  }

  const name = getDisplayName(user);
  const email = user.email ?? "";
  const bio =
    typeof (user.user_metadata as Record<string, unknown>).bio === "string"
      ? ((user.user_metadata as Record<string, unknown>).bio as string)
      : "";
  const avatarUrl =
    typeof (user.user_metadata as Record<string, unknown>).avatar_url === "string"
      ? ((user.user_metadata as Record<string, unknown>).avatar_url as string).trim()
      : "";
  const bannerUrl =
    typeof (user.user_metadata as Record<string, unknown>).banner_url === "string"
      ? ((user.user_metadata as Record<string, unknown>).banner_url as string).trim()
      : "";
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <GlassCard className="overflow-hidden border-white/[0.06] p-0">
        <div
          className="h-28 bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14] bg-cover bg-center"
          style={
            bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined
          }
        />
        <div className="-mt-12 flex flex-col items-center px-6 pb-6 pt-0">
          <Avatar user={user} src={avatarUrl || undefined} label={name} size="lg" />
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
            className={[buttonClasses("secondary", "md", false), "mt-5 touch-manipulation"].join(
              " ",
            )}
          >
            Edit profile
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="border-white/[0.06]">
        <h2 className={sectionEyebrowClass}>Support & legal</h2>
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[#0B0F14]/30">
          {legalLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-[3rem] items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-medium text-white/85 transition hover:bg-white/[0.04] active:bg-white/[0.06]"
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
