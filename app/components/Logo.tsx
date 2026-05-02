/** Minimal green mark — dual nodes (link / network) */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF9C] to-[#22C55E] shadow-[0_0_22px_rgba(0,255,156,0.28)] ring-1 ring-white/15",
        className,
      ].join(" ")}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="12" r="3.5" fill="#0B0F14" />
        <circle cx="15" cy="12" r="3.5" fill="#0B0F14" />
      </svg>
    </span>
  );
}
