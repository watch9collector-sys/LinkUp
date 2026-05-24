export function UploadProgress({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 flex-1 truncate text-white/60">{label}</span>
        <span className="shrink-0 tabular-nums text-emerald-300/90">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
