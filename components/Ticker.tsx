"use client";

import { btcCycle, entryCoins } from "@/lib/entry-config";
import { cycleMetrics } from "@/lib/cycle";
import { num, pct } from "@/lib/format";
import { useMarket } from "./MarketProvider";

function Tick({
  label,
  value,
  decimals,
  hint,
}: {
  label: string;
  value: number | undefined;
  decimals: number;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
        {label}
      </span>
      <span className="font-mono text-[12px] text-ink tabular-nums">
        {value != null ? num(value, decimals) : "—"}
      </span>
      {hint ? (
        <span className="font-mono text-[10px] text-dim tabular-nums">{hint}</span>
      ) : null}
    </div>
  );
}

export function Ticker() {
  const { snapshot } = useMarket();
  const prices = snapshot?.prices ?? {};
  const btc = cycleMetrics(prices.BTC);
  const fng = snapshot?.fearGreed;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      <Tick
        label="BTC"
        value={prices.BTC}
        decimals={0}
        hint={btc.drawdownFromSwing != null ? `${pct(btc.drawdownFromSwing)} swing` : undefined}
      />
      {entryCoins.map((c) => (
        <Tick key={c.id} label={c.id} value={prices[c.id]} decimals={c.priceDecimals} />
      ))}
      <Tick
        label="200W"
        value={btcCycle.weeklyMaUsd}
        decimals={0}
        hint={btc.vsMa != null ? pct(btc.vsMa) : undefined}
      />
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
          F&G
        </span>
        <span className="font-mono text-[12px] text-ink tabular-nums">
          {fng ? `${fng.value} ${fng.classification}` : "—"}
        </span>
      </div>
    </div>
  );
}
