"use client";

import { MarketProvider, useMarket } from "./MarketProvider";
import { Nav } from "./Nav";
import { Ticker } from "./Ticker";
import { clockUtc } from "@/lib/format";
import { useEffect, useState } from "react";

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(clockUtc());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute"
      suppressHydrationWarning
    >
      {now ?? "—"}
    </span>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { snapshot, loading } = useMarket();
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-bg-raised">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[13px] font-medium tracking-[0.22em] text-ink">
              ALPHAGHOST
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              Leigh · personal research
            </span>
            <span className="rounded-sm border border-line-strong px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-dim">
              M2
            </span>
          </div>
          <div className="flex items-center gap-4">
            {loading && !snapshot ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                syncing…
              </span>
            ) : snapshot?.stale ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                cached
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
                live
              </span>
            )}
            <Clock />
          </div>
        </div>
        <div className="border-t border-line px-4 py-2">
          <Ticker />
        </div>
        <Nav />
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <footer className="border-t border-line px-4 py-3">
        <p className="max-w-5xl font-mono text-[10px] leading-relaxed tracking-[0.04em] text-mute">
          Research terminal only — not financial advice, does not execute trades.
          No wallet, no auth, no order routing. Free public marks only.
        </p>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <ShellInner>{children}</ShellInner>
    </MarketProvider>
  );
}
