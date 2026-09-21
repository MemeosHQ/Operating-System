import "server-only";
import { httpJson } from "@/lib/server/http";
import { cached, TTL } from "@/lib/server/cache";
import { DEXSCREENER_API_URL } from "@/lib/config";
import { DataUnavailableError } from "@/lib/errors";
import { classifyTokenNarrative } from "@/lib/metrics/narrative";
import { withAttention } from "@/lib/metrics/attention";
import type { TokenMetrics } from "@/lib/types";

/**
 * SERVER-side DexScreener client (public, keyless).
 * https://docs.dexscreener.com/api/reference
 */

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  liquidity?: { usd?: number };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  txns?: { m5?: { buys: number; sells: number }; h1?: { buys: number; sells: number }; h24?: { buys: number; sells: number } };
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string; socials?: { type: string; url: string }[] };
}

async function getPairs(url: string): Promise<DexPair[]> {
  try {
    const json = await httpJson<{ pairs?: DexPair[] | null }>(
      "DEXSCREENER",
      url,
      {},
      { retries: 2, timeoutMs: 12_000 }
    );
    return (json.pairs ?? []).filter((p) => p.chainId === "solana");
  } catch (err) {
    throw new DataUnavailableError(
      err instanceof Error ? err.message : "Could not reach DexScreener."
    );
  }
}

/** Best (highest-liquidity) pair per base token. */
function pickPrimary(pairs: DexPair[]): Map<string, DexPair> {
  const best = new Map<string, DexPair>();
  for (const p of pairs) {
    const key = p.baseToken.address;
    const cur = best.get(key);
    if (!cur || (p.liquidity?.usd ?? 0) > (cur.liquidity?.usd ?? 0)) best.set(key, p);
  }
  return best;
}

export function pairToToken(p: DexPair): TokenMetrics {
  const ageMinutes = p.pairCreatedAt
    ? Math.max(1, (Date.now() - p.pairCreatedAt) / 60_000)
    : 1;
  const txns = p.txns?.h24;
  return withAttention({
    address: p.baseToken.address,
    name: p.baseToken.name,
    ticker: `$${p.baseToken.symbol}`,
    logoUrl: p.info?.imageUrl,
    marketCapUsd: p.marketCap ?? p.fdv ?? 0,
    liquidityUsd: p.liquidity?.usd ?? 0,
    volume24hUsd: p.volume?.h24 ?? 0,
    priceUsd: Number(p.priceUsd ?? 0),
    priceChange24hPct: p.priceChange?.h24 ?? 0,
    ageMinutes,
    txns24h: txns ? txns.buys + txns.sells : undefined,
    buys24h: txns?.buys,
    sells24h: txns?.sells,
    narrativeTag: classifyTokenNarrative(p.baseToken.name, p.baseToken.symbol),
    status: "bonding",
  });
}

/** Broad Solana meme-market snapshot (cached, polite to rate limits). */
export async function fetchSolanaMemeSnapshot(): Promise<TokenMetrics[]> {
  return cached("dexscreener:snapshot", TTL.MED, async () => {
    const queries = ["SOL", "pump", "meme", "dog", "cat", "ai"];
    const results = await Promise.all(
      queries.map((q) =>
        getPairs(
          `${DEXSCREENER_API_URL}/latest/dex/search?q=${encodeURIComponent(q)}`
        ).catch(() => [] as DexPair[])
      )
    );
    // Record real upstream freshness for the LAST UPDATED / STALE indicators.
    (await import("@/lib/server/freshness")).markUpstreamFetch();
    const primary = pickPrimary(results.flat());
    return [...primary.values()]
      .map(pairToToken)
      .filter((t) => t.marketCapUsd > 0)
      .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
      .slice(0, 60);
  });
}

export async function fetchTokenPair(mint: string): Promise<TokenMetrics> {
  const pairs = await cached(`dexscreener:token:${mint}`, TTL.SHORT, () =>
    getPairs(`${DEXSCREENER_API_URL}/latest/dex/tokens/${encodeURIComponent(mint)}`)
  );
  const primary = pickPrimary(pairs).get(mint);
  if (!primary) {
    throw new DataUnavailableError(
      "No Solana market found for this address on DexScreener."
    );
  }
  return pairToToken(primary);
}
