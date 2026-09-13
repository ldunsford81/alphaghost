"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "BTC Cycle" },
  { href: "/entry", label: "Entry Levels" },
  { href: "/structure", label: "Structure" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/alerts", label: "Alerts" },
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap items-end gap-0 border-b border-line">
      {LINKS.map((link) => {
        const active = link.href === "/" ? path === "/" : path.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              active
                ? "text-ink"
                : "text-mute hover:text-dim"
            }`}
          >
            {link.label}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-px bg-teal" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
