"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthHeroBrand } from "./components/Logo";
import { GlassCard } from "./components/GlassCard";
import { Button, ButtonLink, buttonClasses } from "./components/ui/Button";
import { PageLoading } from "./components/ui/LoadingStates";
import { inputClass, labelClass, sectionEyebrowClass } from "./components/ui/styles";
import { supabase } from "@/src/lib/supabase";
import {
  refreshAuthSessionSnapshot,
  setAuthSessionSnapshot,
  useAuthSession,
} from "@/src/hooks/useAuthSession";
import {
  authErrorGuidance,
  getAuthEmailRedirectTo,
  isLikelyEmailConfirmationPending,
} from "@/src/lib/authUi";
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
      <GlassCard className="h-full border-white/[0.05] p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-emerald-500/20 group-hover:bg-[#0f172a]/90 motion-reduce:group-hover:translate-y-0">
        <h2 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{subtitle}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-400/90 transition-colors group-hover:text-emerald-300">
          Open
          <span aria-hidden>→</span>
        </span>
      </GlassCard>
    </Link>
  );
}

function OnboardingChecklist() {
  const steps = [
    {
      href: "/profile/edit",
      title: "Set up your profile",
      subtitle: "Add a name and short bio so hosts know who is joining.",
    },
    {
      href: "/explore",
      title: "Explore what is live",
      subtitle: "Tap a map pin to preview nearby LinkUps.",
    },
    {
      href: "/linkups",
      title: "Host or join a LinkUp",
      subtitle: "Put a real plan on the calendar in a few taps.",
    },
  ] as const;

  return (
    <GlassCard className="border-white/[0.06] px-5 py-5 sm:px-6 sm:py-6">
      <p className={sectionEyebrowClass}>Get started</p>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Three quick steps to get the most out of LinkUp.
      </p>
      <ul className="mt-5 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0B0F14]/35 p-4 transition duration-200 hover:border-emerald-500/25 hover:bg-[#0B0F14]/55 active:scale-[0.99] motion-reduce:active:scale-100"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-xs font-semibold text-emerald-300/95 ring-1 ring-emerald-500/20">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
                  {step.subtitle}
                </span>
              </span>
              <span
                className="shrink-0 pt-1 text-white/35 transition group-hover:text-emerald-400/90"
                aria-hidden
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

type AuthBanner =
  | { kind: "none" }
  | { kind: "error"; message: string; showResend: boolean }
  | { kind: "check_email"; email: string };

const RESEND_SUCCESS = "Another confirmation email is on its way.";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const AUTH_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_LINKUP_AUTH_DEBUG === "true";

function authErrorDetail(err: unknown): string {
  if (!err || typeof err !== "object") return String(err);
  const record = err as Record<string, unknown>;
  const parts = [
    record.name ? `name=${String(record.name)}` : "",
    record.code ? `code=${String(record.code)}` : "",
    record.status ? `status=${String(record.status)}` : "",
    record.message ? `message=${String(record.message)}` : "",
  ].filter(Boolean);
  return parts.join(" | ") || String(err);
}

function authStorageDebug() {
  if (typeof window === "undefined") return "window unavailable";
  try {
    const testKey = "__linkup_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    const keys = Object.keys(window.localStorage).filter(
      (key) => key.includes("linkup") || key.includes("supabase"),
    );
    return `localStorage=ok authKeys=${keys.length ? keys.join(",") : "none"}`;
  } catch (err: unknown) {
    return `localStorage=failed ${authErrorDetail(err)}`;
  }
}

function reportAuthDebug(label: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!AUTH_DEBUG) return;

  const body = {
    label,
    origin: window.location.origin,
    userAgent: window.navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  try {
    const blob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });
    if (window.navigator.sendBeacon?.("/api/auth-debug", blob)) return;
  } catch {
    // Fall through to fetch below.
  }

  void fetch("/api/auth-debug", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Debug reporting must never affect login.
  });
}

function withAuthTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(message));
    }, AUTH_REQUEST_TIMEOUT_MS);

    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((err: unknown) => {
        window.clearTimeout(timeout);
        reject(err);
      });
  });
}

export function HomeClient() {
  const { session, ready } = useAuthSession({ skipInitialLoading: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [banner, setBanner] = useState<AuthBanner>({ kind: "none" });
  const [authDebug, setAuthDebug] = useState<string[]>([]);
  const [authBusy, setAuthBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendHint, setResendHint] = useState<string | null>(null);

  function clearBanner() {
    setBanner({ kind: "none" });
    setResendHint(null);
    setAuthDebug([]);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    clearBanner();
    setAuthBusy(true);
    try {
      const redirectTo = getAuthEmailRedirectTo();
      if (mode === "signin") {
        const startedDebug = [
          `origin=${window.location.origin}`,
          `redirectTo=${redirectTo ?? "none"}`,
          authStorageDebug(),
        ];
        reportAuthDebug("signIn started", {
          redirectTo: redirectTo ?? null,
          storage: authStorageDebug(),
        });
        setAuthDebug(startedDebug);
        const { data, error } = await withAuthTimeout(
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          }),
          "Sign in timed out. Check your Wi-Fi connection and try again.",
        );
        const resultDebug = [
          ...startedDebug,
          `signIn error=${error ? authErrorDetail(error) : "none"}`,
          `signIn hasSession=${Boolean(data.session)}`,
          `signIn hasUser=${Boolean(data.user)}`,
          `signIn userId=${data.user?.id ?? "none"}`,
          `signIn emailConfirmed=${data.user?.email_confirmed_at ? "yes" : "no-or-unknown"}`,
        ];
        reportAuthDebug("signIn result", {
          error: error
            ? {
                name: error.name,
                code: error.code,
                status: error.status,
                message: error.message,
              }
            : null,
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user),
          userId: data.user?.id ?? null,
          emailConfirmed: Boolean(data.user?.email_confirmed_at),
          sessionUserId: data.session?.user?.id ?? null,
          expiresAt: data.session?.expires_at ?? null,
          storage: authStorageDebug(),
        });
        setAuthDebug(resultDebug);
        if (AUTH_DEBUG) {
          console.info("[LinkUp] signInWithPassword result", {
            errorCode: error?.code ?? null,
            errorMessage: error?.message ?? null,
            errorStatus: error?.status ?? null,
            session: data.session,
            hasSession: Boolean(data.session),
            hasUser: Boolean(data.user),
            user: data.user,
            origin: window.location.origin,
            storage: authStorageDebug(),
          });
        }
        if (error) {
          setBanner({
            kind: "error",
            message: `Supabase sign-in error: ${authErrorDetail(error)}`,
            showResend: authErrorGuidance(error).showResend,
          });
          return;
        }
        if (!data.session) {
          setAuthSessionSnapshot(null);
          setBanner({
            kind: "error",
            message:
              "Sign in did not return a session. If email confirmation is enabled, confirm this account first, then try again.",
            showResend: Boolean(email.trim()),
          });
          return;
        }
        setAuthSessionSnapshot(data.session ?? null);
        void refreshAuthSessionSnapshot().then((nextSession) => {
          const refreshDebug = [
            ...resultDebug,
            `postLogin getSession hasSession=${Boolean(nextSession)}`,
            `postLogin getSession userId=${nextSession?.user?.id ?? "none"}`,
            authStorageDebug(),
          ];
          setAuthDebug(refreshDebug);
          reportAuthDebug("post-login getSession", {
            hasSession: Boolean(nextSession),
            userId: nextSession?.user?.id ?? null,
            storage: authStorageDebug(),
          });
          if (AUTH_DEBUG) {
            console.info("[LinkUp] post-login session check", {
              hasSession: Boolean(nextSession),
              session: nextSession,
              storage: authStorageDebug(),
            });
          }
        });
        void withAuthTimeout(
          supabase.auth.getUser(),
          "getUser timed out after sign in.",
        )
          .then(({ data: userData, error: userError }) => {
            reportAuthDebug("post-login getUser", {
              hasUser: Boolean(userData.user),
              userId: userData.user?.id ?? null,
              error: userError
                ? {
                    name: userError.name,
                    code: userError.code,
                    status: userError.status,
                    message: userError.message,
                  }
                : null,
            });
            if (AUTH_DEBUG) {
              console.info("[LinkUp] post-login getUser", {
                hasUser: Boolean(userData.user),
                user: userData.user,
                error: userError,
              });
            }
            if (userError) {
              setAuthDebug((lines) => [
                ...lines,
                `postLogin getUser error=${authErrorDetail(userError)}`,
              ]);
            }
          })
          .catch((err: unknown) => {
            reportAuthDebug("post-login getUser failed", {
              error: authErrorDetail(err),
            });
            if (AUTH_DEBUG) {
              console.warn("[LinkUp] post-login getUser failed", err);
            }
            setAuthDebug((lines) => [
              ...lines,
              `postLogin getUser failed=${authErrorDetail(err)}`,
            ]);
          });
        setPassword("");
      } else {
        const { data, error } = await withAuthTimeout(
          supabase.auth.signUp({
            email: email.trim(),
            password,
            options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
          }),
          "Account creation timed out. Check your Wi-Fi connection and try again.",
        );
        if (error) {
          const g = authErrorGuidance(error);
          setBanner({
            kind: "error",
            message: g.message,
            showResend: g.showResend,
          });
          return;
        }
        setAuthSessionSnapshot(data.session ?? null);
        setPassword("");
        if (isLikelyEmailConfirmationPending(data.user, data.session)) {
          setBanner({ kind: "check_email", email: email.trim() });
        }
      }
    } catch (err: unknown) {
      const g = authErrorGuidance(err);
      reportAuthDebug("auth exception", {
        error: authErrorDetail(err),
        storage: authStorageDebug(),
      });
      setAuthDebug((lines) => [
        ...lines,
        `auth exception=${authErrorDetail(err)}`,
      ]);
      if (AUTH_DEBUG) {
        console.warn("[LinkUp] auth exception", err);
      }
      setBanner({
        kind: "error",
        message: `Auth request failed: ${authErrorDetail(err) || g.message}`,
        showResend: g.showResend,
      });
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleResendConfirmation() {
    const target =
      banner.kind === "check_email" ? banner.email : email.trim();
    if (!target) return;
    setResendHint(null);
    setResendBusy(true);
    try {
      const redirectTo = getAuthEmailRedirectTo();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: target,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });
      if (error) {
        setResendHint(error.message);
        return;
      }
      setResendHint(RESEND_SUCCESS);
    } finally {
      setResendBusy(false);
    }
  }

  if (!ready) {
    return <PageLoading message="One moment…" />;
  }

  if (!session?.user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="text-center">
          <AuthHeroBrand eyebrowWordmark />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Meet in real life
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/62">
            A calm space for nearby people and live LinkUps — not another feed.
            Sign in to get started.
          </p>
        </div>

        {banner.kind === "check_email" ? (
          <GlassCard className="space-y-5 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Confirm your email</h2>
            <p className="text-[15px] leading-relaxed text-white/65">
              We sent a confirmation link to{" "}
              <span className="font-medium text-white/90">{banner.email}</span>.
              You need to open that link once before you can sign in.
            </p>
            <p className="text-sm text-white/50">
              For local testing you can turn off “Confirm email” under Supabase →
              Authentication → Providers → Email.
            </p>
            {resendHint ? (
              <p
                className={
                  resendHint === RESEND_SUCCESS
                    ? "text-sm text-emerald-400/90"
                    : "text-sm text-red-400/90"
                }
                role="status"
              >
                {resendHint}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="md"
                loading={resendBusy}
                onClick={handleResendConfirmation}
              >
                Resend confirmation email
              </Button>
              <button
                type="button"
                className={[
                  buttonClasses("ghost", "md"),
                  "text-white/70 underline-offset-2 hover:underline",
                ].join(" ")}
                onClick={() => {
                  clearBanner();
                  setMode("signin");
                }}
              >
                Back to sign in
              </button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="space-y-5 p-6 sm:p-8">
            <div className="flex rounded-xl border border-white/[0.06] bg-[#0B0F14]/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  clearBanner();
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
                  clearBanner();
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
              {mode === "signup" ? (
                <p className="text-xs leading-relaxed text-white/45">
                  If email confirmation is enabled in your Supabase project, you
                  will need to click the link in your inbox before signing in.
                </p>
              ) : null}
              {banner.kind === "error" ? (
                <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                  <p className="text-sm text-red-200/95" role="alert">
                    {banner.message}
                  </p>
                  {banner.showResend ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!email.trim()}
                        loading={resendBusy}
                        onClick={handleResendConfirmation}
                      >
                        Resend confirmation email
                      </Button>
                      {resendHint ? (
                        <p
                          className={
                            resendHint === RESEND_SUCCESS
                              ? "text-xs text-emerald-400/90"
                              : "text-xs text-red-300/90"
                          }
                        >
                          {resendHint}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {authDebug.length ? (
                <div className="rounded-xl border border-emerald-500/15 bg-[#06120c]/70 px-4 py-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                    Auth debug
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-white/55">
                    {authDebug.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={authBusy}
              >
                {mode === "signin" ? "Continue" : "Create account"}
              </Button>
            </form>
          </GlassCard>
        )}

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
        <p className={[sectionEyebrowClass, "text-emerald-400/75"].join(" ")}>Today</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hey, {first}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/60 md:mx-0">
          What is live around you? Explore the map, start a LinkUp, or check your
          inbox — stay intentional.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
          <ButtonLink
            href="/explore"
            variant="primary"
            size="md"
            className="justify-center sm:min-w-[10rem]"
          >
            Explore nearby
          </ButtonLink>
          <ButtonLink
            href="/linkups"
            variant="secondary"
            size="md"
            className="justify-center sm:min-w-[10rem]"
          >
            Start a LinkUp
          </ButtonLink>
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

      <OnboardingChecklist />
    </div>
  );
}
