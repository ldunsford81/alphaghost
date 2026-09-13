export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 8000, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type Cache<T> = { at: number; data: T } | null;

export function memoryCache<T>(ttlMs: number) {
  let slot: Cache<T> = null;
  return {
    get(): T | null {
      if (!slot) return null;
      if (Date.now() - slot.at > ttlMs) return null;
      return slot.data;
    },
    set(data: T) {
      slot = { at: Date.now(), data };
    },
  };
}
