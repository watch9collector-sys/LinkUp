"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { Button } from "../components/ui/Button";
import { inputClass, labelClass } from "../components/ui/styles";

const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/safety", label: "Child Safety" },
  { href: "/delete", label: "Delete Account" },
  { href: "/admin", label: "Admin Dashboard" },
] as const;

export function ProfilePanel() {
  const [availability, setAvailability] = useState("");
  const [ghostMode, setGhostMode] = useState(false);
  const [radarRange, setRadarRange] = useState("25 miles");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-br from-[#022c16] via-[#064e3b] to-[#0B0F14]" />
        <div className="-mt-14 flex flex-col items-center px-6 pb-7 pt-0">
          <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border-[3px] border-emerald-500/35 bg-[#0B0F14] text-base font-bold tracking-wide text-emerald-300 shadow-2xl shadow-emerald-950/50 ring-2 ring-emerald-500/15">
            JW
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Joshua Washburn
          </h1>
          <p className="mt-1 text-sm text-white/65">joshua@example.com</p>
          <Button variant="secondary" size="md" className="mt-5">
            Edit Profile
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/55">
          Availability
        </h2>
        <div>
          <label htmlFor="availability" className={labelClass}>
            What are you up for?
          </label>
          <input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className={inputClass}
            placeholder="Coffee, car meet, study session…"
          />
        </div>
        <Button variant="primary" size="md" fullWidth type="button">
          Share availability
        </Button>
      </GlassCard>

      <GlassCard className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/55">
          Privacy & discovery
        </h2>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0B0F14]/40 px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-white">Ghost Mode</p>
            <p className="text-xs text-white/55">Hide from nearby discovery</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ghostMode}
            onClick={() => setGhostMode((v) => !v)}
            className={[
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              ghostMode ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.45)]" : "bg-white/15",
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

        <div className="rounded-xl border border-white/[0.08] bg-[#0B0F14]/40 px-4 py-3.5">
          <label htmlFor="radar" className="text-sm font-medium text-white">
            Radar range
          </label>
          <select
            id="radar"
            value={radarRange}
            onChange={(e) => setRadarRange(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0B0F14]/60 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/35"
          >
            <option className="bg-slate-900 text-white">10 miles</option>
            <option className="bg-slate-900 text-white">25 miles</option>
            <option className="bg-slate-900 text-white">50 miles</option>
            <option className="bg-slate-900 text-white">Unlimited</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/55">
          Account & legal
        </h2>
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0B0F14]/35">
          {legalLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-medium text-white/90 transition hover:bg-emerald-500/[0.07]"
              >
                <span>{label}</span>
                <span className="text-white/35" aria-hidden>
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
