import { fetchJson, memoryCache } from "./http";

const LLAMA_CHARTS = "https://stablecoins.llama.fi/stablecoincharts/all";
const LLAMA_ASSETS = "https://stablecoins.llama.fi/stablecoins?includePrices=true";

export type StablePoint = { time: number; usd: number };

export type StableAsset = {
  symbol: string;
  name: string;
  circulatingUsd: number;
};

export type LiquidityPayload = {
  ok: boolean;
  asOf: string;
  stale: boolean;
  sources: { stables: string | null; etf: string | null };
  errors: string[];
  stables: {
    totalUsd: number | null;
    change1d: number | null;
    change7d: number | null;
    change30d: number | null;
    asOfChart: string | null;
    assets: StableAsset[];
    series90d: StablePoint[];
  };
  etf: {
    available: false;
    reason: string;
  };
};

const cache = memoryCache<LiquidityPayload>(5 * 60_000);

function n(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function usdPeg(row: {
  totalCirculatingUSD?: { peggedUSD?: number };
  date?: string;
}): number | null {
  return n(row.totalCirculatingUSD?.peggedUSD);
}

async function loadStables(): Promise<LiquidityPayload["stables"]> {
  const [charts, assets] = await Promise.all([
    fetchJson<
      {
        date: string;
        totalCirculatingUSD?: { peggedUSD?: number };
      }[]
    >(LLAMA_CHARTS, { timeoutMs: 12_000 }),
    fetchJson<{
      peggedAssets?: {
        symbol?: string;
        name?: string;
        circulating?: { peggedUSD?: number };
      }[];
    }>(LLAMA_ASSETS, { timeoutMs: 12_000 }),
  ]);

  const points = (Array.isArray(charts) ? charts : [])
    .map((row) => {
      const usd = usdPeg(row);
      const time = Number(row.date);
      if (usd == null || !Number.isFinite(time)) return null;
      return { time, usd };
    })
    .filter((p): p is StablePoint => p != null);

  const last = points[points.length - 1] ?? null;
  const ago = (days: number) => {
    if (!last) return null;
    const target = last.time - days * 86400;
    let best: StablePoint | null = null;
    for (const p of points) {
      if (p.time <= target) best = p;
    }
    if (!best) return null;
    return last.usd - best.usd;
  };

  const want = new Set(["USDT", "USDC", "USDe", "DAI", "USDS"]);
  const best = new Map<string, StableAsset>();
  for (const a of assets.peggedAssets ?? []) {
    const symbol = a.symbol ?? "";
    if (!want.has(symbol)) continue;
    const circulatingUsd = n(a.circulating?.peggedUSD) ?? 0;
    if (circulatingUsd <= 0) continue;
    const prev = best.get(symbol);
    if (!prev || circulatingUsd > prev.circulatingUsd) {
      best.set(symbol, {
        symbol,
        name: a.name ?? "",
        circulatingUsd,
      });
    }
  }
  const top = [...best.values()].sort((a, b) => b.circulatingUsd - a.circulatingUsd);

  return {
    totalUsd: last?.usd ?? null,
    change1d: ago(1),
    change7d: ago(7),
    change30d: ago(30),
    asOfChart: last ? new Date(last.time * 1000).toISOString() : null,
    assets: top,
    series90d: points.slice(-90),
  };
}

export async function getLiquidity(): Promise<LiquidityPayload> {
  const hit = cache.get();
  if (hit) return hit;

  const errors: string[] = [];
  let stables: LiquidityPayload["stables"] = {
    totalUsd: null,
    change1d: null,
    change7d: null,
    change30d: null,
    asOfChart: null,
    assets: [],
    series90d: [],
  };
  let stablesSource: string | null = null;

  try {
    stables = await loadStables();
    stablesSource = "DefiLlama stablecoins (USD-pegged circulating)";
  } catch (err) {
    errors.push(`stables: ${err instanceof Error ? err.message : "failed"}`);
  }

  const payload: LiquidityPayload = {
    ok: stables.totalUsd != null,
    asOf: new Date().toISOString(),
    stale: false,
    sources: { stables: stablesSource, etf: null },
    errors,
    stables,
    etf: {
      available: false,
      reason:
        "No reliable free public ETF-flow API (Farside HTML / SoSoValue are blocked or unofficial). Daily prints stay manual until a durable free feed is adopted. Numbers are not invented.",
    },
  };
  cache.set(payload);
  return payload;
}
