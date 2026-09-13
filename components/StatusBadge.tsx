import type { Zone } from "@/lib/levels";

const TONE: Record<Zone["tone"], string> = {
  mute: "border-line-strong text-dim bg-bg-hover",
  teal: "border-teal/40 text-teal bg-teal/10",
  amber: "border-amber/40 text-amber bg-amber/10",
  rose: "border-rose/40 text-rose bg-rose/10",
};

export function StatusBadge({
  zone,
  empty = "—",
}: {
  zone: Zone | null;
  empty?: string;
}) {
  if (!zone) {
    return (
      <span className="inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
        {empty}
      </span>
    );
  }
  return (
    <span
      title={zone.hint}
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${TONE[zone.tone]}`}
    >
      {zone.label}
    </span>
  );
}
