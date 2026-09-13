"use client";

import { entryCoins } from "@/lib/entry-config";
import type { AlertsPayload } from "@/lib/alerts";
import { clockUtc, compactUsd, pct, relativeAge, usd } from "@/lib/format";
import { distancePct } from "@/lib/levels";
import { DataMeta } from "./DataMeta";
import { StatusBadge } from "./StatusBadge";
import { useApi } from "./useApi";
import { useMarket } from "./MarketProvider";
import { zoneForPrice } from "@/lib/levels";

export function AlertsView() {
  const { snapshot } = useMarket();
  const { data, loading, error } = useApi<AlertsPayload>("/api/alerts", 20_000);
  const state = data?.state;
  const live = snapshot?.prices ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            T1–T4 alerts hook
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-dim">
            Read-only mirror of the researcher’s 15m “Alt entry level alerts” routine.
            This page does not write state, fire notifications, or replace the 15m check.
          </p>
        </div>
        <DataMeta
          source={state?.last_source ?? "—"}
          asOf={state?.last_check}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Last check
          </div>
          <div className="mt-1 font-mono text-[13px] text-ink">
            {state?.last_check ? relativeAge(state.last_check) : loading ? "…" : "—"}
          </div>
          <div className="mt-1 font-mono text-[10px] text-mute">
            {state?.last_check ? clockUtc(state.last_check) : "no stamp"}
          </div>
        </div>
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Fired keys
          </div>
          <div className="mt-1 font-mono text-[20px] tabular-nums text-ink">
            {state ? state.fired.length : "—"}
          </div>
          <div className="mt-1 font-mono text-[10px] text-mute">
            {state?.fired.length ? state.fired.join(" · ") : "empty until first hit"}
          </div>
        </div>
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Fetch failures
          </div>
          <div className="mt-1 font-mono text-[20px] tabular-nums text-ink">
            {state?.consecutive_fetch_failures ?? "—"}
          </div>
          <div className="mt-1 font-mono text-[10px] text-mute">
            consecutive (from the 15m writer)
          </div>
        </div>
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            State file
          </div>
          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-amber">
            {data?.origin ?? (loading ? "…" : "missing")}
          </div>
          <div className="mt-1 break-all font-mono text-[10px] text-mute">
            {data?.path ?? "data/alt-entry-alerts-state.json"}
          </div>
        </div>
      </div>

      {data?.origin === "sample" ? (
        <p className="border border-line bg-bg-panel px-3 py-2 font-mono text-[11px] leading-relaxed text-dim">
          Serving the committed sample. Live copy is{" "}
          <code className="text-ink">/workspace/alt-entry-alerts-state.json</code>{" "}
          (or <code className="text-ink">ALERTS_STATE_PATH</code>) when the 15m routine
          writes it. Hit = mark at or below the adopted tranche.
        </p>
      ) : null}

      <section className="overflow-x-auto border border-line bg-bg-panel">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-mute">
              <th className="px-3 py-2 font-medium">Asset</th>
              <th className="px-3 py-2 font-medium">Routine last</th>
              <th className="px-3 py-2 font-medium">Live now</th>
              <th className="px-3 py-2 font-medium">T1</th>
              <th className="px-3 py-2 font-medium">vs T1</th>
              <th className="px-3 py-2 font-medium">Live zone</th>
            </tr>
          </thead>
          <tbody>
            {(["BTC", ...entryCoins.map((c) => c.id)] as const).map((id) => {
              const coin = entryCoins.find((c) => c.id === id);
              const last = state?.last_prices[id];
              const now = live[id];
              const t1 = coin?.levels.t1;
              const zone = coin && now != null ? zoneForPrice(now, coin.levels) : null;
              return (
                <tr key={id} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2 font-mono text-[13px] text-ink">{id}</td>
                  <td className="px-3 py-2 font-mono text-[13px] tabular-nums text-dim">
                    {last != null ? compactUsd(last) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] tabular-nums text-ink">
                    {now != null ? compactUsd(now) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] tabular-nums text-teal">
                    {t1 != null ? usd(t1, coin?.levelDecimals ?? 0) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px] tabular-nums text-mute">
                    {t1 != null && now != null ? pct(distancePct(now, t1)) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {id === "BTC" ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                        cycle
                      </span>
                    ) : (
                      <StatusBadge zone={zone} empty="NO MARK" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Fired (writer)
          </div>
          {state?.fired.length ? (
            <ul className="mt-2 space-y-1 font-mono text-[13px] text-amber">
              {state.fired.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-dim">
              {state?.note ?? "keys like ETH:T1 — empty until first hit"}
            </p>
          )}
        </div>
        <div className="border border-line bg-bg-panel px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Live hits (derived · not written)
          </div>
          {data?.liveHits.length ? (
            <ul className="mt-2 space-y-1 font-mono text-[13px] text-rose">
              {data.liveHits.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-dim">
              No live mark is at or below a T1–T4 tranche right now. The 15m routine
              owns <code className="text-ink">fired[]</code> — this list is display only.
            </p>
          )}
        </div>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-mute">
        {data?.writer} Sample path: <code>data/alt-entry-alerts-state.json</code>.
        {error ? ` · ${error}` : ""}
      </p>
    </div>
  );
}
