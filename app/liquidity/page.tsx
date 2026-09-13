import { SkeletonView } from "@/components/SkeletonView";

export default function LiquidityPage() {
  return (
    <SkeletonView
      kicker="Liquidity"
      title="ETF flow and stablecoin supply belong here. Honest skeleton — no paid flow vendor."
      later="Later: free public ETF / stablecoin prints if a durable source is adopted."
      cards={[
        {
          k: "ETF flows",
          body: "Spot BTC/ETH ETF prints. Not wired. No paid API in this repo.",
        },
        {
          k: "Stablecoin supply",
          body: "USDT/USDC net change as dry powder. Placeholder panel.",
        },
        {
          k: "Desk flow",
          body: "Whale / MM flow is out of scope for a personal free-data terminal.",
        },
      ]}
    />
  );
}
