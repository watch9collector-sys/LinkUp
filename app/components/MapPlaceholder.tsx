import { GlassCard } from "./GlassCard";

export type MapMeetupMarker = {
  id: string;
  label: string;
  topPct: number;
  leftPct: number;
};

type MapPlaceholderProps = {
  markers?: MapMeetupMarker[];
};

export function MapPlaceholder({ markers = [] }: MapPlaceholderProps) {
  return (
    <GlassCard className="relative h-[min(440px,56vh)] min-h-[280px] overflow-hidden border-emerald-500/10 p-0">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b0f14]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(0,255,156,0.07),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_60%,rgba(34,197,94,0.06),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute left-1/2 top-[42%] z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#4ADE80] to-[#15803D] text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_0_28px_rgba(34,197,94,0.45)] ring-4 ring-[#0B0F14]/90">
        You
      </div>

      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute z-[5] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
          style={{ top: `${m.topPct}%`, left: `${m.leftPct}%` }}
          title={m.label}
        >
          <span className="h-4 w-4 rounded-full bg-[#22C55E] shadow-[0_0_14px_rgba(34,197,94,0.65)] ring-2 ring-[#0B0F14]" />
          <span className="max-w-[120px] truncate rounded-md bg-[#0B0F14]/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-100/95 shadow backdrop-blur-sm ring-1 ring-emerald-500/20">
            {m.label}
          </span>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <span className="rounded-lg bg-[#0B0F14]/85 px-3 py-1.5 text-xs font-medium text-white/92 backdrop-blur-md ring-1 ring-emerald-500/15">
          Map preview
        </span>
        <span className="hidden text-xs font-medium text-slate-400 sm:inline">
          Placeholder — connect a map provider
        </span>
      </div>
    </GlassCard>
  );
}
