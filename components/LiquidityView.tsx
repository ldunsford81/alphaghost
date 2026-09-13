"use client";

import { compactBillions } from "@/lib/format";
import type { LiquidityPayload } from "@/lib/liquidity";
import { DataMeta } from "./DataMeta";
import { Sparkline } from "./Sparkline";
import { useApi } from "./useApi";

function delta(n: number | null): string {
  if (n == null) return "—";
  if (n > 0) return `+${compactBillions(n).replace(/^−/, "")}`;
  return compactBillions(n);
}

function deltaTone(n: number | null): string {
  if (n == null || n === 0) return "text-ink";
  return n > 0 ? "text-teal" : "text-rose";
}

export function LiquidityView() {
  const { data, loading, error } = useApi<LiquidityPayload>("/api/liquidity", 5 * 60_000);
  const s = data?.stables;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            Liquidity
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-dim">
            USD-pegged stablecoin circulating supply from DefiLlama. ETF prints stay
            manual — no free flow vendor is wired, and numbers are not invented.
          </p>
        </div>
        <DataMeta source={data?.sources.stables ?? "—"} asOf={s?.asOfChart ?? data?.asOf} />
      </div>

      <div className="grid gap-2 lg:grid-cols-12">
        <section className="border border-line bg-bg-panel px-3 py-2.5 lg:col-span-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            USD-pegged stables
          </div>
          {s?.totalUsd != null ? (
            <>
              <div className="mt-2 font-mono text-[28px] tabular-nums leading-none text-ink">
                {compactBillions(s.totalUsd)}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                total circulating USD peg
              </div>
              <ul className="mt-3 grid grid-cols-3 gap-2 font-mono text-[12px] tabular-nums">
                <li>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-mute">1d</div>
                  <div className={deltaTone(s.change1d)}>{delta(s.change1d)}</div>
                </li>
                <li>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-mute">7d</div>
                  <div className={deltaTone(s.change7d)}>{delta(s.change7d)}</div>
                </li>
                <li>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-mute">30d</div>
                  <div className={deltaTone(s.change30d)}>{delta(s.change30d)}</div>
                </li>
              </ul>
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  90d circulating
                </div>
                <div className="mt-1">
                  <Sparkline values={s.series90d.map((p) => p.usd)} />
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 font-mono text-[12px] text-mute">
              {loading ? "loading stables…" : error || "stablecoin feed unavailable"}
            </p>
          )}
        </section>

        <aside className="border border-line bg-bg-panel px-3 py-2.5 lg:col-span-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Named USD pegs
          </div>
          {s?.assets.length ? (
            <ul className="mt-2 space-y-1.5 font-mono text-[12px] tabular-nums">
              {s.assets.map((a) => (
                <li key={a.symbol} className="flex justify-between gap-3">
                  <span className="text-mute" title={a.name}>
                    {a.symbol}
                  </span>
                  <span className="text-ink">{compactBillions(a.circulatingUsd)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-mute">—</p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-mute">
            DefiLlama <code>circulating.peggedUSD</code> for the named set only.
          </p>
        </aside>
      </div>

      <section className="border border-line bg-bg-panel px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            ETF flows
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
            manual / later
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-dim">
          {data?.etf.reason ??
            "No reliable free public ETF-flow API. Daily prints stay manual."}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
          Not wired · no paid vendor · no invented prints
        </p>
      </section>
    </div>
  );
}
