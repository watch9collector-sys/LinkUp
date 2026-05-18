"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "./Logo";
import { Button } from "./ui/Button";
import { supabase } from "@/src/lib/supabase";
import {
  setAuthSessionSnapshot,
  useAuthSession,
} from "@/src/hooks/useAuthSession";

function iconClass(active: boolean) {
  return active ? "text-emerald-400" : "text-white/45";
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      className={["h-5 w-5", iconClass(active)].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function IconExplore({ active }: { active: boolean }) {
  return (
    <svg
      className={["h-5 w-5", iconClass(active)].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function IconLinkUps({ active }: { active: boolean }) {
  return (
    <svg
      className={["h-5 w-5", iconClass(active)].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg
      className={["h-5 w-5", iconClass(active)].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337L5.05 21l1.395-3.72C5.512 15.042 5 13.574 5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg
      className={["h-5 w-5", iconClass(active)].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

const coreNav = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/explore", label: "Explore", Icon: IconExplore },
  { href: "/linkups", label: "LinkUps", Icon: IconLinkUps },
  { href: "/messages", label: "Messages", Icon: IconMessages },
  { href: "/profile", label: "Profile", Icon: IconProfile },
] as const;

function navLinkClass(active: boolean, compact?: boolean) {
  if (compact) {
    return [
      "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium tracking-tight transition-colors duration-200",
      active ? "text-emerald-400" : "text-white/50 active:text-white/80",
    ].join(" ");
  }
  return [
    "inline-flex min-h-[2.5rem] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200",
    active
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border border-transparent text-white/65 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white",
  ].join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setAuthSessionSnapshot(null);
      router.push("/");
      router.refresh();
    } catch {
      setAuthSessionSnapshot(null);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0F14]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
          >
            <LogoMark />
            <span className="truncate text-lg font-semibold tracking-tight text-white">
              LinkUp
            </span>
          </Link>

          <nav
            className="hidden min-w-0 flex-1 justify-center gap-0.5 md:flex lg:gap-1"
            aria-label="Main"
          >
            {coreNav.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={navLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {ready && user ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  loading={signingOut}
                  className="touch-manipulation !px-2 text-xs font-medium text-white/60 hover:text-white/90 md:hidden"
                >
                  Log out
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  loading={signingOut}
                  className="hidden border-white/[0.08] text-white/85 md:inline-flex"
                >
                  Log out
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0B0F14]/92 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-7xl justify-between gap-0.5 px-2 sm:px-4">
          {coreNav.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={navLinkClass(active, true)}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex flex-col items-center gap-1">
                  <span className="flex h-7 items-center justify-center">
                    <Icon active={active} />
                  </span>
                  <span
                    className={[
                      "h-0.5 w-6 shrink-0 rounded-full transition-colors duration-200",
                      active
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                        : "bg-transparent",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="max-w-[4.5rem] truncate leading-tight">
                    {label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
