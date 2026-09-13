import type { AssetId, CoinId } from "./entry-config";
import type { LevelKey, Zone } from "./levels";

export type Prices = Partial<Record<AssetId, number>>;

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type FearGreed = {
  value: number;
  classification: string;
  timestamp: string;
};

export type Snapshot = {
  ok: boolean;
  stale: boolean;
  asOf: string;
  sources: {
    prices: string;
    fearGreed: string | null;
  };
  errors: string[];
  prices: Prices;
  fearGreed: FearGreed | null;
  fearGreedHistory: FearGreed[];
};

export type CandleResponse = {
  ok: boolean;
  stale: boolean;
  asOf: string;
  source: string;
  errors: string[];
  candles: Candle[];
};

export type EntryRow = {
  id: CoinId;
  price: number | null;
  zone: Zone | null;
  next: { key: LevelKey; usd: number } | null;
};
