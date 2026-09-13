import { SkeletonView } from "@/components/SkeletonView";

export default function StructurePage() {
  return (
    <SkeletonView
      kicker="Market structure"
      title="Higher-high / lower-low map against trend. Honest skeleton — not wired in Milestone 1."
      later="Later: range vs trend, break confirmation, and desk-style structure notes."
      cards={[
        {
          k: "Range / trend",
          body: "Is the tape ranging or trending, and on which timeframe. Placeholder for a later pass.",
        },
        {
          k: "HH / HL map",
          body: "Swing structure so breaks are obvious. No live pivots computed yet.",
        },
        {
          k: "Invalidation",
          body: "Where the working structure thesis dies. Will sit next to the entry blotter.",
        },
      ]}
    />
  );
}
