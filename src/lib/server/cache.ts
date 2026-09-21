/**
 * Tiny in-memory TTL cache for server-side API routes.
 * Keeps us polite with upstream rate limits (DexScreener, Pump.fun, RPC, Birdeye).
 * Intentionally per-process — good enough for a single Next.js server.
 */

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }
  const value = await fetcher();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

/** Periodically drop stale entries so the map doesn't grow forever. */
if (typeof setInterval !== "undefined") {
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.expires <= now) store.delete(k);
    }
  }, 120_000);
  if (typeof sweeper === "object" && "unref" in sweeper) (sweeper as NodeJS.Timeout).unref();
}

export const TTL = { SHORT: 15_000, MED: 60_000, LONG: 300_000, XLONG: 900_000 } as const;

