"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { POLL_MS } from "@/lib/entry-config";
import type { Snapshot } from "@/lib/types";

type MarketCtx = {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<MarketCtx | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(`snapshot ${res.status}`);
      const data = (await res.json()) as Snapshot;
      setSnapshot(data);
      setError(data.ok ? null : data.errors[0] ?? "no live prices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "snapshot failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  return (
    <Ctx.Provider value={{ snapshot, loading, error, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMarket(): MarketCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}
