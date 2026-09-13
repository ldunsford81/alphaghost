import { clockUtc, relativeAge } from "@/lib/format";

export function DataMeta({
  source,
  asOf,
  stale,
}: {
  source: string;
  asOf?: string | null;
  stale?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
      <span>src {source}</span>
      {asOf ? (
        <span title={clockUtc(asOf)}>
          refresh {relativeAge(asOf)}
          {stale ? " · stale cache" : ""}
        </span>
      ) : (
        <span>refresh —</span>
      )}
    </div>
  );
}
