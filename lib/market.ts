import {
  CACHE_TTL_MS,
  coinbaseBtcProduct,
  hlBtcCoin,
  krakenBtcPair,
  type AssetId,
} from "./entry-config";
import type { Candle, CandleResponse, FearGreed, Prices, Snapshot } from "./types";

const HL_INFO = "https://api.hyperliquid.xyz/info";
const COINBASE = "https://api.exchange.coinbase.com/products";
const KRAKEN_TICKER = "https://api.kraken.com/0/public/Ticker";
const KRAKEN_OHLC = "https://api.kraken.com/0/public/OHLC";
const FNG = "https://api.alternative.me/fng/?limit=30";

type Cache<T> = { at: number; data: T } | null;

let snapshotCache: Cache<Snapshot> = null;
let lastGoodSnapshot: Snapshot | null = null;
let candleCache: Cache<CandleResponse> = null;
let lastGoodCandles: CandleResponse | null = null;

async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 8000, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function readCache<T>(cache: Cache<T>, ttl = CACHE_TTL_MS): T | null {
  if (!cache) return null;
  if (Date.now() - cache.at > ttl) return null;
  return cache.data;
}

async function hyperliquidMids(): Promise<Prices> {
  const mids = await fetchJson<Record<string, string>>(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });
  const out: Prices = {};
  const map: Record<AssetId, string> = {
    BTC: hlBtcCoin,
    ETH: "ETH",
    XRP: "XRP",
    SOL: "SOL",
    HYPE: "HYPE",
  };
  for (const [asset, coin] of Object.entries(map) as [AssetId, string][]) {
    const raw = mids[coin];
    const n = raw != null ? Number(raw) : NaN;
    if (Number.isFinite(n) && n > 0) out[asset] = n;
  }
  return out;
}

async function coinbaseSpot(product: string): Promise<number> {
  const data = await fetchJson<{ price: string }>(`${COINBASE}/${product}/ticker`);
  const n = Number(data.price);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`bad Coinbase ${product}`);
  return n;
}

async function coinbaseFill(missing: AssetId[]): Promise<Prices> {
  const product: Partial<Record<AssetId, string>> = {
    BTC: coinbaseBtcProduct,
    ETH: "ETH-USD",
    XRP: "XRP-USD",
    SOL: "SOL-USD",
  };
  const out: Prices = {};
  await Promise.all(
    missing.map(async (id) => {
      const p = product[id];
      if (!p) return;
      try {
        out[id] = await coinbaseSpot(p);
      } catch {
        /* next fallback */
      }
    }),
  );
  return out;
}

async function krakenFill(missing: AssetId[]): Promise<Prices> {
  const pairMap: Partial<Record<AssetId, string>> = {
    BTC: krakenBtcPair,
    ETH: "ETHUSD",
    XRP: "XRPUSD",
    SOL: "SOLUSD",
  };
  const pairs = missing.map((id) => pairMap[id]).filter(Boolean) as string[];
  if (pairs.length === 0) return {};
  const data = await fetchJson<{
    error: string[];
    result?: Record<string, { c: string[] }>;
  }>(`${KRAKEN_TICKER}?pair=${pairs.join(",")}`);
  if (!data.result) return {};
  const out: Prices = {};
  for (const id of missing) {
    const want = pairMap[id];
    if (!want) continue;
    for (const [key, row] of Object.entries(data.result)) {
      if (key === want || key.includes(want.replace("USD", "")) || key.endsWith(want)) {
        const n = Number(row.c?.[0]);
        if (Number.isFinite(n) && n > 0) out[id] = n;
      }
    }
    // Kraken often returns XXBTZUSD / XETHZUSD / XXRPZUSD
    if (out[id] == null) {
      const aliases: Record<string, string[]> = {
        XBTUSD: ["XXBTZUSD", "XBTUSD"],
        ETHUSD: ["XETHZUSD", "ETHUSD"],
        XRPUSD: ["XXRPZUSD", "XRPUSD"],
        SOLUSD: ["SOLUSD"],
      };
      for (const alias of aliases[want] ?? []) {
        const row = data.result[alias];
        const n = Number(row?.c?.[0]);
        if (Number.isFinite(n) && n > 0) out[id] = n;
      }
    }
  }
  return out;
}

async function loadPrices(): Promise<{ prices: Prices; source: string; errors: string[] }> {
  const errors: string[] = [];
  let prices: Prices = {};
  let source = "none";

  try {
    prices = await hyperliquidMids();
    source = "hyperliquid allMids";
  } catch (err) {
    errors.push(`hyperliquid: ${err instanceof Error ? err.message : "failed"}`);
  }

  const needed: AssetId[] = ["BTC", "ETH", "XRP", "SOL", "HYPE"];
  let missing = needed.filter((id) => prices[id] == null);

  if (missing.length) {
    try {
      const fill = await coinbaseFill(missing.filter((id) => id !== "HYPE"));
      prices = { ...prices, ...fill };
      if (source === "none" && Object.keys(fill).length) source = "coinbase ticker";
      else if (Object.keys(fill).length) source = `${source} + coinbase`;
    } catch (err) {
      errors.push(`coinbase: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  missing = needed.filter((id) => prices[id] == null && id !== "HYPE");
  if (missing.length) {
    try {
      const fill = await krakenFill(missing);
      prices = { ...prices, ...fill };
      if (source === "none" && Object.keys(fill).length) source = "kraken ticker";
      else if (Object.keys(fill).length) source = `${source} + kraken`;
    } catch (err) {
      errors.push(`kraken: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  return { prices, source, errors };
}

async function loadFearGreed(): Promise<FearGreed | null> {
  const data = await fetchJson<{
    data?: { value: string; value_classification: string; timestamp: string }[];
  }>(FNG);
  const row = data.data?.[0];
  if (!row) return null;
  const value = Number(row.value);
  if (!Number.isFinite(value)) return null;
  return {
    value,
    classification: row.value_classification,
    timestamp: new Date(Number(row.timestamp) * 1000).toISOString(),
  };
}

export async function getSnapshot(): Promise<Snapshot> {
  const cached = readCache(snapshotCache);
  if (cached) return cached;

  const errors: string[] = [];
  let prices: Prices = {};
  let source = "none";
  let fearGreed: FearGreed | null = null;
  let fngSource: string | null = null;

  try {
    const loaded = await loadPrices();
    prices = loaded.prices;
    source = loaded.source;
    errors.push(...loaded.errors);
  } catch (err) {
    errors.push(`prices: ${err instanceof Error ? err.message : "failed"}`);
  }

  const filledFromCache: string[] = [];
  if (lastGoodSnapshot) {
    for (const id of ["BTC", "ETH", "XRP", "SOL", "HYPE"] as AssetId[]) {
      if (prices[id] == null && lastGoodSnapshot.prices[id] != null) {
        prices[id] = lastGoodSnapshot.prices[id];
        filledFromCache.push(id);
      }
    }
    if (filledFromCache.length) {
      source =
        source === "none"
          ? `last good (${filledFromCache.join(", ")})`
          : `${source} + last good ${filledFromCache.join(", ")}`;
    }
  }

  try {
    fearGreed = await loadFearGreed();
    if (fearGreed) fngSource = "alternative.me";
  } catch (err) {
    errors.push(`fear&greed: ${err instanceof Error ? err.message : "failed"}`);
  }

  const haveAny = Object.keys(prices).length > 0 || fearGreed;
  if (!haveAny && lastGoodSnapshot) {
    const stale: Snapshot = {
      ...lastGoodSnapshot,
      stale: true,
      errors: [...lastGoodSnapshot.errors, ...errors, "serving last good snapshot"],
    };
    snapshotCache = { at: Date.now(), data: stale };
    return stale;
  }

  const snap: Snapshot = {
    ok: Object.keys(prices).length > 0,
    stale: false,
    asOf: new Date().toISOString(),
    sources: { prices: source, fearGreed: fngSource },
    errors,
    prices,
    fearGreed,
  };
  snapshotCache = { at: Date.now(), data: snap };
  if (snap.ok) lastGoodSnapshot = snap;
  return snap;
}

function mapHlCandles(
  rows: { t: number; o: string; h: string; l: string; c: string }[],
): Candle[] {
  return rows
    .map((r) => ({
      time: Math.floor(r.t / 1000),
      open: Number(r.o),
      high: Number(r.h),
      low: Number(r.l),
      close: Number(r.c),
    }))
    .filter((c) => Number.isFinite(c.close) && c.time > 0);
}

async function hyperliquidCandles(): Promise<Candle[]> {
  const end = Date.now();
  const start = end - 400 * 24 * 60 * 60 * 1000;
  const rows = await fetchJson<{ t: number; o: string; h: string; l: string; c: string }[]>(
    HL_INFO,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candleSnapshot",
        req: { coin: "BTC", interval: "1d", startTime: start, endTime: end },
      }),
      timeoutMs: 10_000,
    },
  );
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty HL candles");
  return mapHlCandles(rows);
}

async function coinbaseCandles(): Promise<Candle[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 300 * 24 * 60 * 60;
  const rows = await fetchJson<number[][]>(
    `${COINBASE}/${coinbaseBtcProduct}/candles?granularity=86400&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`,
  );
  return rows
    .map((r) => ({
      time: r[0],
      low: r[1],
      high: r[2],
      open: r[3],
      close: r[4],
    }))
    .filter((c) => Number.isFinite(c.close))
    .sort((a, b) => a.time - b.time);
}

async function krakenCandles(): Promise<Candle[]> {
  const data = await fetchJson<{
    error: string[];
    result?: Record<string, (string | number)[][]>;
  }>(`${KRAKEN_OHLC}?pair=XBTUSD&interval=1440`);
  const table = data.result ? Object.entries(data.result).find(([k]) => k !== "last") : null;
  if (!table) throw new Error("empty Kraken OHLC");
  return table[1]
    .map((r) => ({
      time: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
    }))
    .filter((c) => Number.isFinite(c.close));
}

export async function getBtcCandles(): Promise<CandleResponse> {
  const cached = readCache(candleCache, 60_000);
  if (cached) return cached;

  const errors: string[] = [];
  const attempts: { name: string; run: () => Promise<Candle[]> }[] = [
    { name: "hyperliquid 1d candles", run: hyperliquidCandles },
    { name: "coinbase daily OHLC", run: coinbaseCandles },
    { name: "kraken daily OHLC", run: krakenCandles },
  ];

  for (const attempt of attempts) {
    try {
      const candles = await attempt.run();
      if (candles.length < 10) throw new Error("too few candles");
      const payload: CandleResponse = {
        ok: true,
        stale: false,
        asOf: new Date().toISOString(),
        source: attempt.name,
        errors,
        candles,
      };
      candleCache = { at: Date.now(), data: payload };
      lastGoodCandles = payload;
      return payload;
    } catch (err) {
      errors.push(`${attempt.name}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (lastGoodCandles) {
    const stale: CandleResponse = {
      ...lastGoodCandles,
      stale: true,
      errors: [...lastGoodCandles.errors, ...errors, "serving last good candles"],
    };
    candleCache = { at: Date.now(), data: stale };
    return stale;
  }

  return {
    ok: false,
    stale: false,
    asOf: new Date().toISOString(),
    source: "none",
    errors,
    candles: [],
  };
}

