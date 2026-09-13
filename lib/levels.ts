import type { EntryCoin } from "./entry-config";

export type LevelKey = "t1" | "t2" | "t3" | "t4";

export type ZoneId = "above_t1" | "t1" | "t2" | "t3" | "t4";

export type Zone = {
  id: ZoneId;
  label: string;
  hint: string;
  tone: "mute" | "teal" | "amber" | "rose";
};

const ZONES: Record<ZoneId, Zone> = {
  above_t1: {
    id: "above_t1",
    label: "WATCH",
    hint: "Above T1 — no trigger",
    tone: "mute",
  },
  t1: {
    id: "t1",
    label: "T1 TRIGGER",
    hint: "Primary trigger at 200W",
    tone: "teal",
  },
  t2: {
    id: "t2",
    label: "T2 ADD",
    hint: "Main add zone",
    tone: "amber",
  },
  t3: {
    id: "t3",
    label: "T3 ADD",
    hint: "Main add zone",
    tone: "amber",
  },
  t4: {
    id: "t4",
    label: "T4 FLUSH",
    hint: "Flush only",
    tone: "rose",
  },
};

export function zoneForPrice(price: number, levels: EntryCoin["levels"]): Zone {
  if (price > levels.t1) return ZONES.above_t1;
  if (price > levels.t2) return ZONES.t1;
  if (price > levels.t3) return ZONES.t2;
  if (price > levels.t4) return ZONES.t3;
  return ZONES.t4;
}

/** Fraction of current price remaining to a level (negative = still above). */
export function distancePct(price: number, level: number): number {
  return (level - price) / price;
}

export function distanceUsd(price: number, level: number): number {
  return level - price;
}

export function nextLevel(
  price: number,
  levels: EntryCoin["levels"],
): { key: LevelKey; usd: number } {
  const order: LevelKey[] = ["t1", "t2", "t3", "t4"];
  for (const key of order) {
    if (price > levels[key]) return { key, usd: levels[key] };
  }
  return { key: "t4", usd: levels.t4 };
}

export const LEVEL_META: Record<
  LevelKey,
  { title: string; note: string }
> = {
  t1: { title: "T1", note: "primary trigger at 200W" },
  t2: { title: "T2", note: "main add" },
  t3: { title: "T3", note: "main add" },
  t4: { title: "T4", note: "flush only" },
};
