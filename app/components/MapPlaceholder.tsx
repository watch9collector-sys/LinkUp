import { GlassCard } from "./GlassCard";
import { Spinner } from "./ui/Spinner";

export type MapMeetupMarker = {
  id: string;
  label: string;
  topPct: number;
  leftPct: number;
};

/** Shared frame sizing so skeleton and live map never layout-shift. */
export const mapPlaceholderFrameClass = [
  "relative w-full overflow-hidden rounded-2xl",
  "min-h-[200px] h-[min(38svh,480px)] max-h-[min(560px,62svh)]",
  "sm:min-h-[260px] sm:h-[min(44svh,520px)] sm:max-h-[min(600px,58svh)]",
  "lg:min-h-[280px] lg:h-[min(48vh,560px)] lg:max-h-[640px]",
].join(" ");

type MapPlaceholderProps = {
  markers?: MapMeetupMarker[];
};

export function MapPlaceholderSkeleton() {
  return (
    <GlassCard
      className={`${mapPlaceholderFrameClass} border-emerald-500/10 p-0`}
      aria-busy
      aria-label="Loading map preview"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b0f14]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(148,163,184,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.4)_1px,transparent_1px)] [background-size:22px_22px] sm:[background-size:28px_28px]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,197,94,0.08),transparent_55%)]" />
      <div className="absolute inset-0 animate-pulse bg-emerald-500/[0.03] motion-reduce:animate-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 text-emerald-400/85" />
        <p className="text-xs font-medium text-white/45">Preparing map…</p>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10 sm:bottom-4 sm:left-4 sm:right-4">
        <span className="inline-flex rounded-lg bg-[#0B0F14]/80 px-2.5 py-1 text-[11px] font-medium text-white/55 backdrop-blur-md ring-1 ring-white/[0.06] sm:px-3 sm:text-xs">
          Map preview
        </span>
      </div>
    </GlassCard>
  );
}

export function MapPlaceholder({ markers = [] }: MapPlaceholderProps) {
  return (
    <GlassCard
      className={`${mapPlaceholderFrameClass} border-emerald-500/10 p-0 transition-[box-shadow,border-color] duration-300 ease-out hover:border-emerald-500/20 hover:shadow-[0_0_48px_-12px_rgba(34,197,94,0.12)] motion-reduce:transition-none`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b0f14]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(0,255,156,0.07),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_60%,rgba(34,197,94,0.06),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:22px_22px] sm:[background-size:28px_28px]"
        aria-hidden
      />
      <div className="linkup-map-you absolute left-1/2 top-[42%] z-10 flex h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#4ADE80] to-[#15803D] text-[10px] font-bold uppercase tracking-wide text-white ring-4 ring-[#0B0F14]/90 sm:h-14 sm:w-14">
        You
      </div>

      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute z-[5] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-transform duration-200 motion-reduce:transition-none"
          style={{ top: `${m.topPct}%`, left: `${m.leftPct}%` }}
          title={m.label}
        >
          <span className="h-3.5 w-3.5 rounded-full bg-[#22C55E] shadow-[0_0_14px_rgba(34,197,94,0.65)] ring-2 ring-[#0B0F14] sm:h-4 sm:w-4" />
          <span className="max-w-[min(120px,42vw)] truncate rounded-md bg-[#0B0F14]/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100/95 shadow backdrop-blur-sm ring-1 ring-emerald-500/20 sm:px-2">
            {m.label}
          </span>
        </div>
      ))}

      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-2 sm:bottom-4 sm:left-4 sm:right-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="w-fit rounded-lg bg-[#0B0F14]/85 px-2.5 py-1.5 text-[11px] font-medium text-white/92 backdrop-blur-md ring-1 ring-emerald-500/15 sm:px-3 sm:text-xs">
          Map preview
        </span>
        <span className="text-[11px] font-medium leading-snug text-slate-400/95 sm:text-xs">
          <span className="sm:hidden">Placeholder map</span>
          <span className="hidden sm:inline">Placeholder — connect a map provider</span>
        </span>
      </div>
    </GlassCard>
  );
}
