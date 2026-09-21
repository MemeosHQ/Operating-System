import "server-only";

/**
 * Upstream data freshness tracking — records when market data was last
 * successfully fetched from a live provider so the UI can show honest
 * "LAST UPDATED Xs ago" and STALE indicators (never render-time fakery).
 */

let lastUpstreamFetchAt = 0;

export function markUpstreamFetch(): void {
  lastUpstreamFetchAt = Date.now();
}

/** Seconds since the last successful upstream fetch; null if never. */
export function upstreamAgeSeconds(): number | null {
  if (lastUpstreamFetchAt === 0) return null;
  return Math.max(0, Math.floor((Date.now() - lastUpstreamFetchAt) / 1000));
}
