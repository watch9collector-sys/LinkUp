"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassCard } from "./components/GlassCard";
import { buttonClasses } from "./components/ui/Button";
import { inputClass, labelClass } from "./components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import { getDisplayName } from "@/src/lib/userDisplay";

function HomeTile({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="group block">
      <GlassCard className="h-full border-white/[0.05] p-5 transition duration-200 group-hover:border-emerald-500/20 group-hover:bg-[#0f172a]/90">
        <h2 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{subtitle}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-400/90 group-hover:text-emerald-300">
          Open
          <span aria-hidden>→</span>
        </span>
      </GlassCard>
    </Link>
  );
}

export function HomeClient() {
  const { session, ready } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      setPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(message);
    } finally {
      setAuthBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">
        Loading…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400/80">
            LinkUp
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Meet in real life
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/62">
            A calm space for nearby people and live LinkUps — not another feed.
            Sign in to get started.
          </p>
        </div>

        <GlassCard className="space-y-5 p-6 sm:p-8">
          <div className="flex rounded-xl border border-white/[0.06] bg-[#0B0F14]/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setAuthError(null);
              }}
              className={[
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
                mode === "signin"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/45 hover:text-white/75",
              ].join(" ")}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setAuthError(null);
              }}
              className={[
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
                mode === "signup"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/45 hover:text-white/75",
              ].join(" ")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="home-email" className={labelClass}>
                Email
              </label>
              <input
                id="home-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="home-password" className={labelClass}>
                Password
              </label>
              <input
                id="home-password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            {authError ? (
              <p className="text-sm text-red-400/95" role="alert">
                {authError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={authBusy}
              className={[
                buttonClasses("primary", "lg"),
                "w-full",
              ].join(" ")}
            >
              {authBusy
                ? "Please wait…"
                : mode === "signin"
                  ? "Continue"
                  : "Create account"}
            </button>
          </form>
        </GlassCard>

        <p className="text-center text-xs text-white/40">
          You can still open Explore as a guest — sign in to host LinkUps and use
          Messages later.
        </p>
      </div>
    );
  }

  const first = getDisplayName(session.user);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/75">
          Today
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hey, {first}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/60 md:mx-0">
          What is live around you? Explore the map, start a LinkUp, or check your
          inbox — stay intentional.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
          <Link
            href="/explore"
            className={[buttonClasses("primary", "md"), "inline-flex justify-center sm:min-w-[9rem]"].join(
              " ",
            )}
          >
            Explore nearby
          </Link>
          <Link
            href="/linkups"
            className={[
              buttonClasses("secondary", "md"),
              "inline-flex justify-center border-white/[0.08] sm:min-w-[9rem]",
            ].join(" ")}
          >
            Start a LinkUp
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <HomeTile
          href="/explore"
          title="Explore"
          subtitle="Map and nearby activity — people, communities, live pins."
        />
        <HomeTile
          href="/linkups"
          title="LinkUps"
          subtitle="Create or join a real-world plan in a few taps."
        />
        <HomeTile
          href="/messages"
          title="Messages"
          subtitle="Threads with people you actually meet — no clutter."
        />
      </div>

      <GlassCard className="border-white/[0.05] px-5 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Next up
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Onboarding, live discovery, map data, messaging, and notifications — built
          step by step on this foundation.
        </p>
      </GlassCard>
    </div>
  );
}
