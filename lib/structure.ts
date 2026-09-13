import { fetchJson, memoryCache } from "./http";

const HL_INFO = "https://api.hyperliquid.xyz/info";
const CG_GLOBAL = "https://api.coingecko.com/api/v3/global";

export type DominanceSlice = { id: string; label: string; pct: number };

export type PerpSnapshot = {
  coin: "BTC" | "HYPE";
  fundingHourly: number | null;
  openInterestCoin: number | null;
  markPx: number | null;
  notionalUsd: number | null;
  available: boolean;
  detail: string;
};

export type StructurePayload = {
  ok: boolean;
  asOf: string;
  stale: boolean;
  sources: { dominance: string | null; perps: string | null };
  errors: string[];
  dominance: {
    slices: DominanceSlice[];
    btc: number | null;
    eth: number | null;
    majors: number | null;
    stablesInCap: number | null;
    rest: number | null;
    totalMcapUsd: number | null;
    mcapChange24hPct: number | null;
  };
  perps: PerpSnapshot[];
};

const cache = memoryCache<StructurePayload>(60_000);

function n(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

async function loadDominance(): Promise<StructurePayload["dominance"]> {
  const data = await fetchJson<{
    data?: {
      market_cap_percentage?: Record<string, number>;
      total_market_cap?: { usd?: number };
      market_cap_change_percentage_24h_usd?: number;
    };
  }>(CG_GLOBAL, {
    headers: { Accept: "application/json" },
    timeoutMs: 10_000,
  });
  const mcp = data.data?.market_cap_percentage ?? {};
  const btc = n(mcp.btc);
  const eth = n(mcp.eth);
  const sol = n(mcp.sol);
  const xrp = n(mcp.xrp);
  const usdt = n(mcp.usdt);
  const usdc = n(mcp.usdc);
  const majors = btc != null && eth != null ? btc + eth : null;
  const stablesInCap = (usdt ?? 0) + (usdc ?? 0) || null;
  const named =
    (btc ?? 0) + (eth ?? 0) + (sol ?? 0) + (xrp ?? 0) + (usdt ?? 0) + (usdc ?? 0);
  const rest = named > 0 ? Math.max(0, 100 - named) : null;

  const slices: DominanceSlice[] = [
    { id: "btc", label: "BTC", pct: btc ?? 0 },
    { id: "eth", label: "ETH", pct: eth ?? 0 },
    { id: "sol", label: "SOL", pct: sol ?? 0 },
    { id: "xrp", label: "XRP", pct: xrp ?? 0 },
    { id: "usdt", label: "USDT", pct: usdt ?? 0 },
    { id: "usdc", label: "USDC", pct: usdc ?? 0 },
  ].filter((s) => s.pct > 0);

  return {
    slices,
    btc,
    eth,
    majors,
    stablesInCap,
    rest,
    totalMcapUsd: n(data.data?.total_market_cap?.usd),
    mcapChange24hPct: n(data.data?.market_cap_change_percentage_24h_usd),
  };
}

async function loadPerps(): Promise<PerpSnapshot[]> {
  const raw = await fetchJson<[
    { universe?: { name: string }[] },
    {
      funding?: string;
      openInterest?: string;
      markPx?: string;
    }[],
  ]>(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    timeoutMs: 10_000,
  });
  const universe = raw[0]?.universe ?? [];
  const ctxs = raw[1] ?? [];
  const want: Array<"BTC" | "HYPE"> = ["BTC", "HYPE"];
  return want.map((coin) => {
    const i = universe.findIndex((u) => u.name === coin);
    if (i < 0 || !ctxs[i]) {
      return {
        coin,
        fundingHourly: null,
        openInterestCoin: null,
        markPx: null,
        notionalUsd: null,
        available: false,
        detail: "coin missing from Hyperliquid metaAndAssetCtxs",
      };
    }
    const fundingHourly = n(ctxs[i].funding);
    const openInterestCoin = n(ctxs[i].openInterest);
    const markPx = n(ctxs[i].markPx);
    const notionalUsd =
      openInterestCoin != null && markPx != null ? openInterestCoin * markPx : null;
    return {
      coin,
      fundingHourly,
      openInterestCoin,
      markPx,
      notionalUsd,
      available: fundingHourly != null || openInterestCoin != null,
      detail: "Hyperliquid metaAndAssetCtxs — funding is the raw hourly rate",
    };
  });
}

const emptyDominance: StructurePayload["dominance"] = {
  slices: [],
  btc: null,
  eth: null,
  majors: null,
  stablesInCap: null,
  rest: null,
  totalMcapUsd: null,
  mcapChange24hPct: null,
};

export async function getStructure(): Promise<StructurePayload> {
  const hit = cache.get();
  if (hit) return hit;

  const errors: string[] = [];
  let dominance = emptyDominance;
  let domSource: string | null = null;
  let perps: PerpSnapshot[] = [
    {
      coin: "BTC",
      fundingHourly: null,
      openInterestCoin: null,
      markPx: null,
      notionalUsd: null,
      available: false,
      detail: "not fetched",
    },
    {
      coin: "HYPE",
      fundingHourly: null,
      openInterestCoin: null,
      markPx: null,
      notionalUsd: null,
      available: false,
      detail: "not fetched",
    },
  ];
  let perpSource: string | null = null;

  try {
    dominance = await loadDominance();
    domSource = "coingecko /global market_cap_percentage";
  } catch (err) {
    errors.push(`dominance: ${err instanceof Error ? err.message : "failed"}`);
  }

  try {
    perps = await loadPerps();
    perpSource = "hyperliquid metaAndAssetCtxs";
  } catch (err) {
    errors.push(`perps: ${err instanceof Error ? err.message : "failed"}`);
    perps = perps.map((p) => ({
      ...p,
      available: false,
      detail: "Hyperliquid funding/OI unavailable",
    }));
  }

  const payload: StructurePayload = {
    ok: dominance.btc != null || perps.some((p) => p.available),
    asOf: new Date().toISOString(),
    stale: false,
    sources: { dominance: domSource, perps: perpSource },
    errors,
    dominance,
    perps,
  };
  cache.set(payload);
  return payload;
}
