import { DataMeta } from "./DataMeta";

export function SkeletonView({
  kicker,
  title,
  later,
  cards,
  liveSlot,
  source = "not wired",
}: {
  kicker: string;
  title: string;
  later: string;
  cards: { k: string; body: string }[];
  liveSlot?: React.ReactNode;
  source?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-[12px] uppercase tracking-[0.18em] text-dim">
            {kicker}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-dim">{title}</p>
        </div>
        <DataMeta source={source} />
      </div>

      {liveSlot}

      <div className="grid gap-2 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.k} className="border border-line bg-bg-panel px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                {card.k}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
                later
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-dim">{card.body}</p>
            <div className="mt-4 space-y-1.5">
              <div className="h-2 w-3/4 bg-bg-hover" />
              <div className="h-2 w-1/2 bg-bg-hover" />
              <div className="h-2 w-2/3 bg-bg-hover" />
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{later}</p>
    </div>
  );
}
