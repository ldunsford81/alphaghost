"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { btcCycle, RESEARCH_AS_OF } from "@/lib/entry-config";
import { compactUsd, num, pct, usd } from "@/lib/format";
import { cycleMetrics } from "@/lib/cycle";
import type { CandleResponse } from "@/lib/types";
import { DataMeta } from "./DataMeta";
import { useMarket } from "./MarketProvider";

const BtcChart = dynamic(() => import("./BtcChart").then((m) => m.BtcChart), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
      loading chart…
    </div>
  ),
});

function Stat({
  k,
  v,
  sub,
  tone,
}: {
  k: string;
  v: string;
  sub?: string;
  tone?: "teal" | "amber" | "rose" | "dim";
}) {
  const color =
    tone === "teal"
      ? "text-teal"
      : tone === "amber"
        ? "text-amber"
        : tone === "rose"
          ? "text-rose"
          : "text-ink";
  return (
    <div className="border border-line bg-bg-panel px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{k}</div>
      <div className={`mt-1 font-mono text-[20px] tabular-nums leading-none ${color}`}>{v}</div>
      {sub ? <div className="mt-1.5 font-mono text-[10px] text-dim">{sub}</div> : null}
    </div>
  );
}

export function CycleView() {
  const { snapshot } = useMarket();
  const [candles, setCandles] = useState<CandleResponse | null>(null);
  const [showScenarios, setShowScenarios] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/candles", { cache: "no-store" });
        const data = (await res.json()) as CandleResponse;
        if (alive) setCandles(data);
      } catch {
        if (alive) {
          setCandles({
            ok: false,
            stale: false,
            asOf: new Date().toISOString(),
            source: "none",
            errors: ["candles failed"],
            candles: [],
          });
        }
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const m = cycleMetrics(snapshot?.prices.BTC);
  const vsMaTone =
    m.vsMa == null ? undefined : m.vsMa >= 0 ? "teal" : "rose";
  const ddTone =
    m.drawdownFromSwing == null
      ? undefined
      : m.drawdownFromSwing > -0.1
        ? "dim"
        : m.drawdownFromSwing > -0.2
          ? "amber"
          : "rose";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            BTC Cycle / 200W
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-dim">
            Live BTC spot vs adopted 200-week MA and the 2026-09-03 swing high.
            MA is the {RESEARCH_AS_OF} research print — not recomputed on this
            terminal.
          </p>
        </div>
        <DataMeta
          source={snapshot?.sources.prices ?? "—"}
          asOf={snapshot?.asOf}
          stale={snapshot?.stale}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          k="BTC spot"
          v={m.spot != null ? usd(m.spot, 0) : "—"}
          sub={snapshot ? `mark · ${snapshot.sources.prices}` : "awaiting mark"}
        />
        <Stat
          k="200W MA"
          v={usd(btcCycle.weeklyMaUsd, 0)}
          sub={`${btcCycle.weeklyMaSource} · adopted ${RESEARCH_AS_OF}`}
          tone="amber"
        />
        <Stat
          k="vs 200W"
          v={m.vsMa != null ? pct(m.vsMa) : "—"}
          sub={m.vsMaUsd != null ? `${m.vsMaUsd >= 0 ? "+" : ""}${usd(m.vsMaUsd, 0)} vs MA` : "—"}
          tone={vsMaTone}
        />
        <Stat
          k="drawdown vs swing"
          v={m.drawdownFromSwing != null ? pct(m.drawdownFromSwing) : "—"}
          sub={`swing ${usd(btcCycle.swingHighUsd, 0)} · ${btcCycle.swingHighDate}`}
          tone={ddTone}
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-12">
        <section className="border border-line bg-bg-panel lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              Daily · MA + swing + scenario
            </span>
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
              <input
                type="checkbox"
                checked={showScenarios}
                onChange={(e) => setShowScenarios(e.target.checked)}
                className="accent-teal"
              />
              −10 / −20 / −30 from swing
            </label>
          </div>
          {candles?.ok ? (
            <BtcChart candles={candles.candles} showScenarios={showScenarios} />
          ) : (
            <div className="flex h-[380px] items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
              {candles ? "no candle feed" : "loading chart…"}
            </div>
          )}
          <div className="border-t border-line px-3 py-2">
            <DataMeta
              source={candles?.source ?? "—"}
              asOf={candles?.asOf}
              stale={candles?.stale}
            />
          </div>
        </section>

        <aside className="space-y-2 lg:col-span-3">
          <div className="border border-line bg-bg-panel px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              Swing → MA (adopted)
            </div>
            <div className="mt-1 font-mono text-[18px] tabular-nums text-ink">
              {pct(-btcCycle.drawdownSwingToMa)}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-dim">
              Research drawdown from swing to the 200W print. Live drawdown
              uses the current mark vs {compactUsd(btcCycle.swingHighUsd)}.
            </p>
          </div>
          <div className="border border-line bg-bg-panel px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              Scenario from swing
            </div>
            <ul className="mt-2 space-y-1.5">
              {btcCycle.scenarioLines.map((line) => {
                const dist =
                  m.spot != null ? (line.usd - m.spot) / m.spot : null;
                return (
                  <li
                    key={line.id}
                    className="flex items-baseline justify-between gap-2 font-mono text-[12px] tabular-nums"
                  >
                    <span className="text-dim">
                      {line.label}
                      <span className="ml-2 text-mute">{usd(line.usd, 0)}</span>
                    </span>
                    <span className="text-ink">{dist != null ? pct(dist) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border border-line bg-bg-panel px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              Cycle read
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-dim">
              {m.spot == null
                ? "Waiting on a BTC mark."
                : m.spot >= btcCycle.weeklyMaUsd
                  ? `Spot is above the adopted 200W (${num(btcCycle.weeklyMaUsd, 0)}). Not a 200W tag. Watch the swing drawdown for the entry plan.`
                  : `Spot is below the adopted 200W. This is the regime the T1–T4 blotter is built for.`}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
