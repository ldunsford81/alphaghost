import { FearGreedPanel } from "@/components/FearGreedPanel";
import { SkeletonView } from "@/components/SkeletonView";

export default function SentimentPage() {
  return (
    <SkeletonView
      kicker="Sentiment"
      title="Fear & Greed is live from alternative.me. Broader bull/bear tape is a later milestone."
      later="Later: funding, social heat, and a 15m regime tag next to T1–T4."
      source="alternative.me Fear & Greed"
      liveSlot={<FearGreedPanel />}
      cards={[
        {
          k: "Bull / bear",
          body: "High-frequency sentiment shift. Not computed here — Coiners-style panel TBD.",
        },
        {
          k: "Funding / OI",
          body: "Perp crowding as a caution overlay on adds. No feed in v1.",
        },
        {
          k: "Alt heat",
          body: "Breadth vs BTC. Placeholder so the chrome stays consistent.",
        },
      ]}
    />
  );
}
