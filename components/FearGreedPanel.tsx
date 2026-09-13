"use client";

import { num } from "@/lib/format";
import { DataMeta } from "./DataMeta";
import { useMarket } from "./MarketProvider";

function toneFor(value: number): string {
  if (value <= 25) return "text-rose";
  if (value <= 45) return "text-amber";
  if (value <= 55) return "text-ink";
  if (value <= 75) return "text-teal";
  return "text-amber";
}

export function FearGreedPanel() {
  const { snapshot } = useMarket();
  const fng = snapshot?.fearGreed;
  return (
    <div className="border border-line bg-bg-panel px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Fear & Greed
          </div>
          <div className={`mt-1 font-mono text-[42px] leading-none tabular-nums ${fng ? toneFor(fng.value) : "text-mute"}`}>
            {fng ? num(fng.value, 0) : "—"}
          </div>
          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">
            {fng?.classification ?? "no print"}
          </div>
        </div>
        <div className="w-full max-w-xs">
          <div className="h-1.5 w-full bg-bg-hover">
            <div
              className="h-1.5 bg-teal"
              style={{ width: `${fng ? Math.min(100, fng.value) : 0}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-mute">
            <span>fear</span>
            <span>greed</span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <DataMeta
          source={snapshot?.sources.fearGreed ?? "alternative.me"}
          asOf={snapshot?.asOf}
          stale={snapshot?.stale}
        />
      </div>
    </div>
  );
}
