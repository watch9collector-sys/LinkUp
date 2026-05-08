import Link from "next/link";
import { GlassCard } from "./components/GlassCard";
import { buttonClasses } from "./components/ui/Button";
import { supabase } from '../src/lib/supabase'


export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <GlassCard
        as="section"
        className="border-emerald-500/10 text-center md:px-10 md:py-12"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/85">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl md:tracking-tighter">
          Welcome back, Joshua
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/72 md:text-base">
          Ready to link up? Discover who is around, send a shoutout, and keep
          your status in sync.
        </p>
        <Link
          href="/discover"
          className={[
            buttonClasses("primary", "lg"),
            "mt-8 shadow-xl shadow-emerald-950/40",
          ].join(" ")}
        >
          Link Up Now
        </Link>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/discover" className="group block min-h-[200px]">
          <GlassCard className="flex h-full flex-col border-white/[0.06] transition duration-200 group-hover:border-emerald-500/25 group-hover:bg-[#111827]/95 group-hover:shadow-[0_0_40px_-12px_rgba(34,197,94,0.12)]">
            <div className="text-3xl" aria-hidden>
              🧭
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
              Discover
            </h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/70">
              Browse the map preview and see meetups when they appear near you.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400/95 group-hover:text-emerald-300">
              Open Discover
              <span aria-hidden>→</span>
            </span>
          </GlassCard>
        </Link>

        <Link href="/shoutouts" className="group block min-h-[200px]">
          <GlassCard className="flex h-full flex-col border-white/[0.06] transition duration-200 group-hover:border-emerald-500/25 group-hover:bg-[#111827]/95 group-hover:shadow-[0_0_40px_-12px_rgba(34,197,94,0.12)]">
            <div className="text-3xl" aria-hidden>
              📣
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
              Shoutouts
            </h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/70">
              Broadcast a location-based invite so people nearby can join you.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400/95 group-hover:text-emerald-300">
              Open Shoutouts
              <span aria-hidden>→</span>
            </span>
          </GlassCard>
        </Link>
      </div>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/45">
          Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="border-emerald-500/8 text-center sm:text-left">
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/12 sm:mx-0"
              role="img"
              aria-label="Available indicator"
            >
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)] ring-2 ring-emerald-300/35" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Available</p>
            <p className="mt-1 text-xs leading-relaxed text-white/58">
              You can receive link-up requests
            </p>
          </GlassCard>
          <GlassCard className="border-emerald-500/8 text-center sm:text-left">
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 sm:mx-0"
              role="img"
              aria-label="Discoverable indicator"
            >
              <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400/90 bg-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Discoverable</p>
            <p className="mt-1 text-xs leading-relaxed text-white/58">
              Visible on the map within your radar
            </p>
          </GlassCard>
          <GlassCard className="border-emerald-500/8 text-center sm:text-left">
            <div className="mx-auto inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200/95 sm:mx-0">
              Free
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Account tier</p>
            <p className="mt-1 text-xs leading-relaxed text-white/58">
              Upgrade paths coming soon
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
