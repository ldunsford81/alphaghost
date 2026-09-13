/**
 * Leigh's adopted 200W MA entry plan — single editable module.
 *
 * Research as-of 2026-09-12. Levels below are the adopted alert plan;
 * do not "recompute" T1–T4 at runtime. Edit numbers here when research updates.
 *
 * Formula reference (how the plan was derived; not used live):
 *   entry = alt_close_on_BTC_swing_day × (1 − multiplier × BTC_drawdown)
 *
 * Example: ETH T1 ≈ 2508.1 × (1 − 1.28 × 0.2066) ≈ 1845
 *
 * T1 = primary trigger at 200W · T2–T3 = main adds · T4 = flush only
 */

export const RESEARCH_AS_OF = "2026-09-12";

export const btcCycle = {
  /** Adopted 200-week SMA (Kraken completed-week closes). */
  weeklyMaUsd: 65268,
  weeklyMaLabel: "200W MA",
  weeklyMaSource: "Kraken completed-week SMA",
  /** 2026-09-03 HL daily high. */
  swingHighUsd: 82268,
  swingHighDate: "2026-09-03",
  swingHighNote: "HL daily high",
  /** Swing → MA, adopted (~20.66%). */
  drawdownSwingToMa: 0.2066,
  /** Optional BTC scenario lines from the swing high (alerts / chart overlays). */
  scenarioLines: [
    { id: "p10", label: "−10%", pct: -0.1, usd: 74041 },
    { id: "p20", label: "−20%", pct: -0.2, usd: 65814 },
    { id: "p30", label: "−30%", pct: -0.3, usd: 57588 },
  ] as const,
} as const;

export type CoinId = "ETH" | "XRP" | "SOL" | "HYPE";
export type AssetId = "BTC" | CoinId;

export type EntryCoin = {
  id: CoinId;
  name: string;
  /** Hyperliquid `allMids` / candle coin. */
  hlCoin: string;
  coinbaseProduct: string | null;
  krakenPair: string | null;
  /** Display decimals for live marks. */
  priceDecimals: number;
  /** Display decimals for T1–T4. */
  levelDecimals: number;
  swingDayClose: number;
  volMult: { base: number; cap: number };
  /** Research-table tier steps (display only). */
  tiers: readonly [number, number, number, number];
  /** Adopted T1–T4 USD alerts — use exactly. */
  levels: { t1: number; t2: number; t3: number; t4: number };
};

export const entryCoins: readonly EntryCoin[] = [
  {
    id: "ETH",
    name: "Ether",
    hlCoin: "ETH",
    coinbaseProduct: "ETH-USD",
    krakenPair: "ETHUSD",
    priceDecimals: 2,
    levelDecimals: 0,
    swingDayClose: 2508.1,
    volMult: { base: 1.28, cap: 1.69 },
    tiers: [0, 6, 12, 18],
    levels: { t1: 1845, t2: 1738, t3: 1632, t4: 1520 },
  },
  {
    id: "XRP",
    name: "XRP",
    hlCoin: "XRP",
    coinbaseProduct: "XRP-USD",
    krakenPair: "XRPUSD",
    priceDecimals: 4,
    levelDecimals: 2,
    swingDayClose: 1.4513,
    volMult: { base: 1.23, cap: 1.65 },
    tiers: [0, 6, 11, 17],
    levels: { t1: 1.08, t2: 1.02, t3: 0.96, t4: 0.9 },
  },
  {
    id: "SOL",
    name: "Solana",
    hlCoin: "SOL",
    coinbaseProduct: "SOL-USD",
    krakenPair: "SOLUSD",
    priceDecimals: 2,
    levelDecimals: 0,
    swingDayClose: 103.92,
    volMult: { base: 1.35, cap: 2.0 },
    tiers: [0, 9, 19, 27],
    levels: { t1: 75, t2: 68, t3: 61, t4: 55 },
  },
  {
    id: "HYPE",
    name: "Hyperliquid",
    hlCoin: "HYPE",
    coinbaseProduct: null,
    krakenPair: null,
    priceDecimals: 2,
    levelDecimals: 0,
    swingDayClose: 87.49,
    volMult: { base: 1.5, cap: 2.54 },
    tiers: [0, 15, 30, 38],
    levels: { t1: 60, t2: 51, t3: 42, t4: 37 },
  },
] as const;

export const hlBtcCoin = "BTC";
export const coinbaseBtcProduct = "BTC-USD";
export const krakenBtcPair = "XBTUSD";

export const POLL_MS = 20_000;
export const CACHE_TTL_MS = 15_000;
