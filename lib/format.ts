export function usd(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function compactUsd(value: number): string {
  if (value >= 1000) return usd(value, 0);
  if (value >= 10) return usd(value, 2);
  return usd(value, 4);
}

export function num(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Signed percent string. `ratio` is a fraction (e.g. -0.064 → "−6.40%"). */
export function pct(ratio: number, decimals = 2): string {
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return `${sign}${Math.abs(ratio * 100).toFixed(decimals)}%`;
}

export function clockUtc(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export function relativeAge(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  if (ms < 2_000) return "just now";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}
