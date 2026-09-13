"use client";

import { RESEARCH_AS_OF, btcCycle } from "@/lib/entry-config";
import { compactBillions, num, pct, usd } from "@/lib/format";
import { regimeRead } from "@/lib/regime";
import type { StructurePayload } from "@/lib/structure";
import { cycleMetrics } from "@/lib/cycle";
import { DataMeta } from "./DataMeta";
import { useApi } from "./useApi";
import { useMarket } from "./MarketProvider";

function fundingLabel(hourly: number | null): string {
  if (hourly == null) return "—";
  return `${pct(hourly, 4)} / hr`;
}

export function StructureView() {
  const { snapshot } = useMarket();
  const { data, loading, error } = useApi<StructurePayload>("/api/structure", 60_000);
  const m = cycleMetrics(snapshot?.prices.BTC);
  const regime = regimeRead(m.spot);
  const d = data?.dominance;
  const perps = data?.perps ?? [];

  const barTotal =
    (d?.btc ?? 0) + (d?.eth ?? 0) + (d?.stablesInCap ?? 0) + (d?.rest ?? 0) || 100;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            Market structure
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-dim">
            BTC dominance and a majors/rest strip from CoinGecko. Regime is a stub from
            live spot vs the adopted 200W / swing in{" "}
            <code className="text-ink">lib/entry-config.ts</code> — not a HH/HL engine.
          </p>
        </div>
        <DataMeta
          source={data?.sources.dominance ?? "—"}
          asOf={data?.asOf}
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-12">
        <section className="border border-line bg-bg-panel px-3 py-2.5 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              BTC.D / majors vs rest
            </span>
            <span className="font-mono text-[10px] text-mute">
              {d?.totalMcapUsd != null ? `${compactBillions(d.totalMcapUsd)} mcap` : "—"}
              {d?.mcapChange24hPct != null
                ? ` · 24h ${pct(d.mcapChange24hPct / 100)}`
                : ""}
            </span>
          </div>
          {d?.btc != null ? (
            <>
              <div className="mt-3 flex h-3 w-full overflow-hidden bg-bg-hover">
                <div
                  className="bg-amber"
                  style={{ width: `${((d.btc ?? 0) / barTotal) * 100}%` }}
                  title={`BTC ${d.btc.toFixed(2)}%`}
                />
                <div
                  className="bg-teal"
                  style={{ width: `${((d.eth ?? 0) / barTotal) * 100}%` }}
                  title={`ETH ${d.eth?.toFixed(2)}%`}
                />
                <div
                  className="bg-line-strong"
                  style={{ width: `${((d.stablesInCap ?? 0) / barTotal) * 100}%` }}
                  title={`USDT+USDC ${d.stablesInCap?.toFixed(2)}%`}
                />
                <div
                  className="bg-bg-hover"
                  style={{ width: `${((d.rest ?? 0) / barTotal) * 100}%` }}
                  title={`rest ${d.rest?.toFixed(2)}%`}
                />
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12px] tabular-nums sm:grid-cols-3">
                <li className="flex justify-between gap-3">
                  <span className="text-mute">BTC</span>
                  <span className="text-amber">{d.btc.toFixed(2)}%</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-mute">ETH</span>
                  <span className="text-teal">{d.eth != null ? `${d.eth.toFixed(2)}%` : "—"}</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-mute">BTC+ETH</span>
                  <span className="text-ink">
                    {d.majors != null ? `${d.majors.toFixed(2)}%` : "—"}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-mute">USDT+USDC</span>
                  <span className="text-dim">
                    {d.stablesInCap != null ? `${d.stablesInCap.toFixed(2)}%` : "—"}
                  </span>
                </li>
                {d.slices
                  .filter((s) => s.id === "sol" || s.id === "xrp")
                  .map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span className="text-mute">{s.label}</span>
                      <span className="text-ink">{s.pct.toFixed(2)}%</span>
                    </li>
                  ))}
                <li className="flex justify-between gap-3">
                  <span className="text-mute">Rest of cap</span>
                  <span className="text-ink">
                    {d.rest != null ? `${d.rest.toFixed(2)}%` : "—"}
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-mute">
                CoinGecko <code>market_cap_percentage</code> — listed coins only; rest is
                100 minus BTC/ETH/SOL/XRP/USDT/USDC. Not a custom alt-season index.
              </p>
            </>
          ) : (
            <p className="mt-3 font-mono text-[12px] text-mute">
              {loading ? "loading dominance…" : error || "dominance unavailable"}
            </p>
          )}
        </section>

        <aside className="border border-line bg-bg-panel px-3 py-2.5 lg:col-span-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Regime stub · {RESEARCH_AS_OF} anchors
          </div>
          <div
            className={`mt-2 font-mono text-[18px] ${
              regime.tone === "teal"
                ? "text-teal"
                : regime.tone === "amber"
                  ? "text-amber"
                  : regime.tone === "rose"
                    ? "text-rose"
                    : "text-mute"
            }`}
          >
            {regime.label}
          </div>
          <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {regime.tape}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-dim">{regime.detail}</p>
          <ul className="mt-3 space-y-1 font-mono text-[12px] tabular-nums">
            <li className="flex justify-between gap-3">
              <span className="text-mute">Spot</span>
              <span className="text-ink">{m.spot != null ? usd(m.spot, 0) : "—"}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">200W MA</span>
              <span className="text-amber">{usd(btcCycle.weeklyMaUsd, 0)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">vs MA</span>
              <span className="text-ink">{m.vsMa != null ? pct(m.vsMa) : "—"}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">Swing</span>
              <span className="text-ink">{usd(btcCycle.swingHighUsd, 0)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">vs swing</span>
              <span className="text-ink">
                {m.drawdownFromSwing != null ? pct(m.drawdownFromSwing) : "—"}
              </span>
            </li>
          </ul>
        </aside>
      </div>

      <section className="border border-line bg-bg-panel px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Funding / OI · BTC + HYPE
          </span>
          <DataMeta source={data?.sources.perps ?? "—"} asOf={data?.asOf} />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {perps.map((p) => (
            <div key={p.coin} className="border border-line px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] text-ink">{p.coin}</span>
                {p.available ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-teal">
                    live
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
                    unavailable
                  </span>
                )}
              </div>
              {p.available ? (
                <ul className="mt-2 space-y-1 font-mono text-[12px] tabular-nums">
                  <li className="flex justify-between gap-3">
                    <span className="text-mute">Funding</span>
                    <span className="text-ink">{fundingLabel(p.fundingHourly)}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-mute">OI (coin)</span>
                    <span className="text-ink">
                      {p.openInterestCoin != null
                        ? num(p.openInterestCoin, p.coin === "BTC" ? 1 : 0)
                        : "—"}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-mute">OI notional</span>
                    <span className="text-ink">
                      {p.notionalUsd != null ? compactBillions(p.notionalUsd) : "—"}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-mute">Mark</span>
                    <span className="text-ink">
                      {p.markPx != null ? usd(p.markPx, p.coin === "BTC" ? 0 : 2) : "—"}
                    </span>
                  </li>
                </ul>
              ) : (
                <p className="mt-2 text-[12px] text-dim">{p.detail}</p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-mute">
          Hyperliquid public <code>metaAndAssetCtxs</code>. Funding is the raw hourly
          rate (not annualized). OI is coin units × mark — not inventing a second book.
        </p>
        {data?.errors.length ? (
          <p className="mt-2 font-mono text-[10px] text-amber">{data.errors.join(" · ")}</p>
        ) : null}
      </section>
    </div>
  );
}
