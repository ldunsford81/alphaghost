"use client";

import Link from "next/link";
import { RESEARCH_AS_OF, btcCycle, entryCoins } from "@/lib/entry-config";
import { num, pct, usd } from "@/lib/format";
import { LEVEL_META, distancePct, nextLevel, zoneForPrice } from "@/lib/levels";
import { DataMeta } from "./DataMeta";
import { StatusBadge } from "./StatusBadge";
import { useMarket } from "./MarketProvider";

export function EntryBoard() {
  const { snapshot } = useMarket();
  const prices = snapshot?.prices ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            BTC 200W MA entry plan · ~$65.3k anchor
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-dim">
            Vol mult = ~1Y HP downside (BTC down ≥1% days) · base median / cap p75.
            T1–T4 are the adopted {RESEARCH_AS_OF} alerts — distance is live.
          </p>
        </div>
        <DataMeta
          source={snapshot?.sources.prices ?? "—"}
          asOf={snapshot?.asOf}
          stale={snapshot?.stale}
        />
      </div>

      <div className="overflow-x-auto border border-line bg-bg-panel">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-mute">
              <th className="px-3 py-2 font-medium">Coin</th>
              <th className="px-3 py-2 font-medium">Live</th>
              <th className="px-3 py-2 font-medium">Vol mult</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Tiers</th>
              <th className="px-3 py-2 font-medium">T1</th>
              <th className="px-3 py-2 font-medium">T2</th>
              <th className="px-3 py-2 font-medium">T3</th>
              <th className="px-3 py-2 font-medium">T4</th>
              <th className="px-3 py-2 font-medium">Next</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {entryCoins.map((coin) => {
              const live = prices[coin.id];
              const zone = live != null ? zoneForPrice(live, coin.levels) : null;
              const nxt = live != null ? nextLevel(live, coin.levels) : null;
              const cells: Array<[keyof typeof coin.levels, number]> = [
                ["t1", coin.levels.t1],
                ["t2", coin.levels.t2],
                ["t3", coin.levels.t3],
                ["t4", coin.levels.t4],
              ];
              return (
                <tr key={coin.id} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2.5 align-top">
                    <div className="font-mono text-[13px] text-ink">{coin.id}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                      {coin.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[13px] tabular-nums text-ink">
                    {live != null ? usd(live, coin.priceDecimals) : "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[12px] tabular-nums text-dim">
                    {coin.volMult.base.toFixed(2)}x / {coin.volMult.cap.toFixed(2)}x
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[13px] tabular-nums text-teal">
                    {usd(coin.levels.t1, coin.levelDecimals)}
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[12px] tabular-nums text-mute">
                    {coin.tiers.join("/")}
                  </td>
                  {cells.map(([key, level]) => {
                    const dist = live != null ? distancePct(live, level) : null;
                    const hit = live != null && live <= level;
                    return (
                      <td key={key} className="px-3 py-2.5 align-top">
                        <div
                          className={`font-mono text-[13px] tabular-nums ${hit ? "text-amber" : "text-ink"}`}
                        >
                          {usd(level, coin.levelDecimals)}
                        </div>
                        <div className="font-mono text-[10px] tabular-nums text-mute">
                          {dist != null ? pct(dist) : "—"}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 align-top">
                    {nxt && live != null ? (
                      <>
                        <div className="font-mono text-[12px] uppercase tracking-[0.12em] text-dim">
                          {LEVEL_META[nxt.key].title}
                        </div>
                        <div className="font-mono text-[12px] tabular-nums text-ink">
                          {pct(distancePct(live, nxt.usd))}
                        </div>
                      </>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <StatusBadge zone={zone} empty="NO MARK" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
        T1 = primary trigger at 200W · T2–T3 = main adds · T4 = flush only
      </p>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Swing-day alt closes
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[12px] tabular-nums">
            {entryCoins.map((c) => (
              <li key={c.id} className="flex justify-between gap-3">
                <span className="text-mute">{c.id}</span>
                <span className="text-ink">{num(c.swingDayClose, c.priceDecimals)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-dim">
            BTC swing {usd(btcCycle.swingHighUsd, 0)} on {btcCycle.swingHighDate}. Used
            only as research context — levels are fixed.
          </p>
        </div>
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            15m T1–T4 routine
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-dim">
            The researcher&apos;s 15-minute check still owns fired keys. This blotter
            is the watchlist; the read-only hook lives on{" "}
            <Link href="/alerts" className="text-teal hover:underline">
              /alerts
            </Link>
            . No notifications and no order routing.
          </p>
        </div>
      </div>
    </div>
  );
}
