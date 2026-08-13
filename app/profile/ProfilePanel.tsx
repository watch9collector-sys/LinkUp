"use client";

import { BlockedUsersPanel } from "../components/moderation/BlockedUsersPanel";
import { Avatar } from "../components/Avatar";
import { GlassCard } from "../components/GlassCard";
import { buttonClasses } from "../components/ui/Button";
import { PageLoading } from "../components/ui/LoadingStates";
import { sectionEyebrowClass } from "../components/ui/styles";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { polishProfileBio } from "@/src/lib/investorDisplay";
import { checkIsPlatformFounder } from "@/src/lib/moderationApi";
import { getDisplayName } from "@/src/lib/userDisplay";
import { useEffect, useState } from "react";
import Link from "next/link";

const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/child-safety", label: "Child safety" },
  { href: "/delete", label: "Delete account" },
] as const;

export function ProfilePanel() {
  const { user, ready } = useAuthSession();
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void checkIsPlatformFounder().then((value) => {
      if (!cancelled) setIsFounder(value);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
  const rawBio =
    typeof (user.user_metadata as Record<string, unknown>).bio === "string"
      ? ((user.user_metadata as Record<string, unknown>).bio as string)
      : "";
  const bio = polishProfileBio(rawBio);
  const avatarUrl =
    typeof (user.user_metadata as Record<string, unknown>).avatar_url === "string"
      ? ((user.user_metadata as Record<string, unknown>).avatar_url as string).trim()
      : "";
  const bannerUrl =
    typeof (user.user_metadata as Record<string, unknown>).banner_url === "string"
      ? ((user.user_metadata as Record<string, unknown>).banner_url as string).trim()
      : "";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 sm:gap-7">
      <GlassCard className="overflow-hidden border-white/[0.06] p-0">
        <div
          className="h-32 bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14] bg-cover bg-center sm:h-36"
          style={
            bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined
          }
        />
        <div className="-mt-14 flex flex-col items-center px-6 pb-8 pt-0 text-center sm:-mt-16 sm:px-8 sm:pb-10">
          <Avatar user={user} src={avatarUrl || undefined} label={name} size="lg" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {name}
          </h1>
          {bio ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/58 sm:max-w-md sm:text-[15px]">
              {bio}
            </p>
          ) : (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/42">
              Add a short bio so people know who you are.
            </p>
          )}
          <Link
            href="/profile/edit"
            className={[buttonClasses("secondary", "md", false), "mt-6 touch-manipulation"].join(
              " ",
            )}
          >
            Edit profile
          </Link>
        </div>
      </GlassCard>

      <BlockedUsersPanel />

      {isFounder ? (
        <GlassCard className="border-white/[0.06] p-6 sm:p-7">
          <h2 className={sectionEyebrowClass}>Founder tools</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Review user reports submitted through the app.
          </p>
          <Link
            href="/admin"
            className={[
              buttonClasses("secondary", "md", false),
              "mt-4 inline-flex touch-manipulation",
            ].join(" ")}
          >
            Open report review
          </Link>
        </GlassCard>
      ) : null}

      <GlassCard className="border-white/[0.06] p-6 sm:p-7">
        <h2 className={sectionEyebrowClass}>Support & legal</h2>
        <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#0B0F14]/30">
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
