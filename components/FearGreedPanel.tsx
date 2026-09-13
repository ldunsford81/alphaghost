"use client";

import { num } from "@/lib/format";
import type { FearGreed } from "@/lib/types";
import { DataMeta } from "./DataMeta";
import { Sparkline } from "./Sparkline";
import { useMarket } from "./MarketProvider";

function toneFor(value: number): string {
  if (value <= 24) return "text-rose";
  if (value <= 44) return "text-amber";
  if (value <= 55) return "text-ink";
  if (value <= 74) return "text-teal";
  return "text-amber";
}

function bandFor(value: number): { title: string; range: string; meaning: string } {
  if (value <= 24) {
    return {
      title: "Extreme Fear",
      range: "0–24",
      meaning:
        "Capitulation prints. Historically a friendlier add backdrop — not a T1–T4 trigger by itself.",
    };
  }
  if (value <= 44) {
    return {
      title: "Fear",
      range: "25–44",
      meaning: "Risk-off tape. Watch the 200W tag; do not treat this index as an entry clock.",
    };
  }
  if (value <= 55) {
    return {
      title: "Neutral",
      range: "45–55",
      meaning: "No crowd extreme. Regime still comes from spot vs the adopted 200W / swing.",
    };
  }
  if (value <= 74) {
    return {
      title: "Greed",
      range: "56–74",
      meaning: "Crowd is offered. Adds wait for the blotter, not for this number to roll over.",
    };
  }
  return {
    title: "Extreme Greed",
    range: "75–100",
    meaning: "Late-cycle heat historically. Not a short signal here — just context.",
  };
}

export function FearGreedPanel() {
  const { snapshot } = useMarket();
  const fng = snapshot?.fearGreed;
  const history = snapshot?.fearGreedHistory ?? [];
  const band = fng ? bandFor(fng.value) : null;

  return (
    <div className="border border-line bg-bg-panel px-3 py-3">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Fear & Greed
          </div>
          <div
            className={`mt-1 font-mono text-[42px] leading-none tabular-nums ${fng ? toneFor(fng.value) : "text-mute"}`}
          >
            {fng ? num(fng.value, 0) : "—"}
          </div>
          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">
            {fng?.classification ?? "no print"}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            30d history
          </div>
          <div className="mt-2">
            <Sparkline values={history.map((h: FearGreed) => h.value)} />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-mute">
            <span>{history[0] ? num(history[0].value, 0) : "—"}</span>
            <span>today {fng ? num(fng.value, 0) : "—"}</span>
          </div>
        </div>
        <div className="lg:col-span-5">
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
          {band ? (
            <div className="mt-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                {band.title} · {band.range}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-dim">{band.meaning}</p>
            </div>
          ) : (
            <p className="mt-3 text-[12px] text-mute">No Fear & Greed print.</p>
          )}
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
