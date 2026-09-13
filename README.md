# alphaghost

Leigh’s personal Coiner-style **research terminal** (Milestone 2).

Not an exchange, not The Coiners Pro/community/OTC. No auth, no wallet connect, no order execution. Dark desktop blotter for BTC cycle context, the adopted ETH / XRP / SOL / HYPE T1–T4 entry plan, structure / liquidity / sentiment, and a read-only 15m alerts hook.

Inspired by the *shape* of [thecoiners.io](https://thecoiners.io/) — a single place to read cycle, levels, structure, sentiment, and liquidity — not a clone of their product.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production compile
npm run start   # serve the build
```

No `.env`, no API keys, no paid vendors.

## Panels

| Route | Status |
| --- | --- |
| `/` BTC Cycle / 200W | Live — spot vs adopted 200W MA, swing drawdown, daily chart + scenario lines |
| `/entry` Entry Levels | Live — ETH / XRP / SOL / HYPE T1–T4, distance, status badges |
| `/structure` | Live — BTC.D / majors vs rest (CoinGecko), regime stub from 200W + swing, HL funding/OI for BTC+HYPE |
| `/sentiment` | Live Fear & Greed + 30d sparkline + meaning band |
| `/liquidity` | Live USD-pegged stables (DefiLlama). ETF flows = honest manual/later |
| `/alerts` | Read-only 15m T1–T4 hook (`fired`, `last_check`, `last_prices`) |

Footer on every page: research terminal only — not financial advice, does not execute trades.

## Edit the entry plan

All adopted research numbers live in **one module**:

```
lib/entry-config.ts
```

Update there when the researcher reprints:

- `btcCycle.weeklyMaUsd` — adopted 200W MA (Kraken completed-week SMA)
- `btcCycle.swingHighUsd` / `swingHighDate`
- `btcCycle.drawdownSwingToMa`
- `btcCycle.scenarioLines` (−10 / −20 / −30 from swing)
- `entryCoins[]` — swing-day closes, vol mults (base/cap), **exact T1–T4 USD alerts**

The terminal **does not recompute** T1–T4 from the formula at runtime. The formula is documented in that file for the next research pass:

```
entry = alt_close_on_BTC_swing_day × (1 − multiplier × BTC_drawdown)
```

T1 = primary trigger at 200W · T2–T3 = main adds · T4 = flush only.

As of **2026-09-12**:

| Coin | Vol mult base/cap | T1 | T2 | T3 | T4 |
| --- | --- | --- | --- | --- | --- |
| ETH | 1.28 / 1.69 | 1845 | 1738 | 1632 | 1520 |
| XRP | 1.23 / 1.65 | 1.08 | 1.02 | 0.96 | 0.90 |
| SOL | 1.35 / 2.00 | 75 | 68 | 61 | 55 |
| HYPE | 1.50 / 2.54 | 60 | 51 | 42 | 37 |

BTC 200W MA **65268**. Swing high **82268** (2026-09-03). Scenario: −10% **74041** · −20% **65814** · −30% **57588**.

## Alerts hook (read-only)

The researcher’s **15m “Alt entry level alerts”** routine is the writer. This app only reads.

1. Canonical live file on the shared box: `/workspace/alt-entry-alerts-state.json`
2. Repo sample (committed): `data/alt-entry-alerts-state.json`
3. Optional override: `ALERTS_STATE_PATH`

`GET /api/alerts` tries those paths in order. Hit = mark **at or below** the adopted tranche. Keys look like `ETH:T1`. `fired[]` stays empty until the routine records a hit. The Alerts page also shows a derived “live hits” list from current marks — display only, not written back.

State shape:

```json
{
  "fired": [],
  "note": "keys like ETH:T1 — empty until first hit",
  "last_check": "ISO timestamp",
  "last_prices": { "BTC": 0, "ETH": 0, "XRP": 0, "SOL": 0, "HYPE": 0 },
  "last_source": "hyperliquid_allMids",
  "consecutive_fetch_failures": 0
}
```

No push notifications in this milestone.

## Data sources (free / public)

Marks refresh about every 20s via `/api/snapshot`. Each live panel shows **source + last refresh**. If a feed dies, the last good snapshot is served and labelled stale.

**Prices (primary → fallback)**

1. [Hyperliquid info](https://api.hyperliquid.xyz/info) `allMids` — BTC, ETH, XRP, SOL, HYPE
2. [Coinbase Exchange ticker](https://api.exchange.coinbase.com/products/BTC-USD/ticker) — majors if HL misses
3. [Kraken ticker](https://api.kraken.com/0/public/Ticker) — majors if Coinbase misses

**BTC daily candles (chart)**

1. Hyperliquid `candleSnapshot` `BTC` `1d`
2. Coinbase daily OHLC
3. Kraken `OHLC` `XBTUSD` interval 1440

**Structure**

- [CoinGecko global](https://api.coingecko.com/api/v3/global) — `market_cap_percentage` (BTC.D, ETH, SOL, XRP, USDT, USDC)
- Hyperliquid `metaAndAssetCtxs` — BTC + HYPE hourly funding and OI (shown unavailable if the call fails; never faked)

**Liquidity**

- [DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoincharts/all) — USD-pegged circulating + 1d/7d/30d change
- ETF flows: **not wired** — no reliable free public API

**Sentiment**

- [alternative.me Fear & Greed](https://api.alternative.me/fng/?limit=30) — latest + 30 daily prints

The 200W MA on the cycle panel is the **adopted research print** in `entry-config.ts`, not a live SMA rebuild. Candle overlays use that same print plus the swing / scenario lines.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, [lightweight-charts](https://github.com/tradingview/lightweight-charts).
