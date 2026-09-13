import { btcCycle } from "./entry-config";

export type RegimeTone = "mute" | "teal" | "amber" | "rose";

export type RegimeRead = {
  label: string;
  tape: string;
  detail: string;
  tone: RegimeTone;
};

/**
 * Stub regime from live spot vs adopted 200W MA + swing in entry-config.
 * Not a HH/HL pivot engine — do not treat as structure confirmation.
 */
export function regimeRead(spot: number | null | undefined): RegimeRead {
  if (spot == null) {
    return {
      label: "NO MARK",
      tape: "—",
      detail: "Waiting on a BTC mark. Regime is not inferred without a price.",
      tone: "mute",
    };
  }

  const ma = btcCycle.weeklyMaUsd;
  const swing = btcCycle.swingHighUsd;
  const vsMa = (spot - ma) / ma;
  const vsSwing = (spot - swing) / swing;
  const ten = btcCycle.scenarioLines[0].usd;

  if (spot < ma) {
    return {
      label: "BELOW 200W",
      tape: "TREND INTO MA",
      detail: `Spot is ${pctPts(vsMa)} vs the adopted 200W (${ma}). This is the tag regime the T1–T4 blotter is built for. Not a pivot map.`,
      tone: "rose",
    };
  }

  if (spot >= swing * 0.98) {
    return {
      label: "NEAR SWING",
      tape: "RANGE / HELD HIGH",
      detail: `Spot is ${pctPts(vsSwing)} vs the ${btcCycle.swingHighDate} swing (${swing}). Pressed against the research swing — range stub, not a break.`,
      tone: "amber",
    };
  }

  if (spot > ten) {
    return {
      label: "ABOVE 200W",
      tape: "HELD / MID-RANGE",
      detail: `Above adopted 200W (${pctPts(vsMa)}) and still inside the −10% swing line (${ten}). Not a 200W tag. Mid-drawdown range stub.`,
      tone: "teal",
    };
  }

  return {
    label: "ABOVE 200W",
    tape: "DRAWDOWN TOWARD MA",
    detail: `Above adopted 200W (${pctPts(vsMa)}) but through the −10% swing line. Watching the MA tag — still a stub from two anchors, not HH/HL.`,
    tone: "amber",
  };
}

function pctPts(ratio: number): string {
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return `${sign}${Math.abs(ratio * 100).toFixed(2)}%`;
}
