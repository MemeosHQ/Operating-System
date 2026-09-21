import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter (per key, e.g. client IP).
 * Protects the Gemini endpoint from unbounded/spammy requests without any
 * external dependency. Keys are hashed — no IP is stored in clear text.
 */

interface Bucket {
  hits: number[];
}

const WINDOW_MS = 60_000;
const MAX_HITS = 10;
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max = MAX_HITS, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= max) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  // Opportunistic cleanup.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
