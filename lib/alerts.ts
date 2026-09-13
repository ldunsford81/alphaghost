import { readFile } from "node:fs/promises";
import path from "node:path";
import { entryCoins, type AssetId } from "./entry-config";
import type { Prices } from "./types";

export type AlertsState = {
  fired: string[];
  note?: string;
  last_check: string | null;
  last_prices: Partial<Record<AssetId, number>>;
  last_source: string;
  consecutive_fetch_failures: number;
};

export type AlertsPayload = {
  ok: boolean;
  asOf: string;
  path: string | null;
  origin: "canonical" | "sample" | "missing";
  writer: string;
  state: AlertsState;
  liveHits: string[];
  errors: string[];
};

const SAMPLE = path.join(process.cwd(), "data/alt-entry-alerts-state.json");
const CANONICAL = "/workspace/alt-entry-alerts-state.json";

const EMPTY: AlertsState = {
  fired: [],
  note: "keys like ETH:T1 — empty until first hit",
  last_check: null,
  last_prices: {},
  last_source: "none",
  consecutive_fetch_failures: 0,
};

export function liveHits(prices: Prices): string[] {
  const hits: string[] = [];
  for (const coin of entryCoins) {
    const p = prices[coin.id];
    if (p == null) continue;
    for (const key of ["t1", "t2", "t3", "t4"] as const) {
      if (p <= coin.levels[key]) hits.push(`${coin.id}:${key.toUpperCase()}`);
    }
  }
  return hits;
}

function parseState(raw: unknown): AlertsState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const o = raw as Record<string, unknown>;
  const prices = (o.last_prices ?? {}) as Record<string, unknown>;
  const last_prices: AlertsState["last_prices"] = {};
  for (const id of ["BTC", "ETH", "XRP", "SOL", "HYPE"] as AssetId[]) {
    const n = Number(prices[id]);
    if (Number.isFinite(n) && n > 0) last_prices[id] = n;
  }
  return {
    fired: Array.isArray(o.fired) ? o.fired.map(String) : [],
    note: typeof o.note === "string" ? o.note : EMPTY.note,
    last_check: typeof o.last_check === "string" ? o.last_check : null,
    last_prices,
    last_source: typeof o.last_source === "string" ? o.last_source : "none",
    consecutive_fetch_failures:
      typeof o.consecutive_fetch_failures === "number"
        ? o.consecutive_fetch_failures
        : 0,
  };
}

async function readJsonFile(file: string): Promise<unknown> {
  const text = await readFile(file, "utf8");
  return JSON.parse(text) as unknown;
}

export async function getAlerts(livePrices: Prices = {}): Promise<AlertsPayload> {
  const errors: string[] = [];
  const envPath = process.env.ALERTS_STATE_PATH;
  const candidates: { file: string; origin: AlertsPayload["origin"] }[] = [
    ...(envPath ? [{ file: envPath, origin: "canonical" as const }] : []),
    { file: CANONICAL, origin: "canonical" },
    { file: SAMPLE, origin: "sample" },
  ];

  for (const { file, origin } of candidates) {
    try {
      const raw = await readJsonFile(file);
      const state = parseState(raw);
      return {
        ok: true,
        asOf: new Date().toISOString(),
        path: file,
        origin,
        writer:
          "Researcher 15m “Alt entry level alerts” routine is the writer. This terminal only reads.",
        state,
        liveHits: liveHits(livePrices),
        errors,
      };
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      if (code !== "ENOENT") {
        errors.push(`${file}: ${err instanceof Error ? err.message : "read failed"}`);
      }
    }
  }

  return {
    ok: false,
    asOf: new Date().toISOString(),
    path: null,
    origin: "missing",
    writer:
      "Researcher 15m “Alt entry level alerts” routine is the writer. This terminal only reads.",
    state: EMPTY,
    liveHits: liveHits(livePrices),
    errors: [...errors, "no alerts state file found"],
  };
}
