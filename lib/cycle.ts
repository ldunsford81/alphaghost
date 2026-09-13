import { btcCycle } from "./entry-config";

export function cycleMetrics(btcSpot: number | undefined) {
  const spot = btcSpot ?? null;
  const vsMa = spot != null ? (spot - btcCycle.weeklyMaUsd) / btcCycle.weeklyMaUsd : null;
  const vsMaUsd = spot != null ? spot - btcCycle.weeklyMaUsd : null;
  const dd = spot != null ? (spot - btcCycle.swingHighUsd) / btcCycle.swingHighUsd : null;
  return {
    spot,
    vsMa,
    vsMaUsd,
    drawdownFromSwing: dd,
    adoptedMaDrawdown: btcCycle.drawdownSwingToMa,
  };
}
