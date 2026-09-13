import { FearGreedPanel } from "@/components/FearGreedPanel";

export default function SentimentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
          Sentiment
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-dim">
          Fear & Greed from alternative.me — live print, 30-day sparkline, and a short
          meaning band. No second paid proxy.
        </p>
      </div>
      <FearGreedPanel />
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
        Funding / OI lives on Structure. Alerts hook is on /alerts. No social heat in v2.
      </p>
    </div>
  );
}
