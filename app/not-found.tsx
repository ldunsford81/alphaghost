import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col justify-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">404</div>
      <h1 className="mt-2 font-mono text-[16px] text-ink">Panel not found.</h1>
      <Link
        href="/"
        className="mt-4 w-fit font-mono text-[11px] uppercase tracking-[0.16em] text-teal hover:underline"
      >
        Back to BTC Cycle
      </Link>
    </div>
  );
}
