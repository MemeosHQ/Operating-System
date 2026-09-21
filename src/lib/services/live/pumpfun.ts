import "server-only";
import { httpJson } from "@/lib/server/http";
import { cached, TTL } from "@/lib/server/cache";
import { DataUnavailableError } from "@/lib/errors";
import { classifyTokenNarrative } from "@/lib/metrics/narrative";
import type { Launch } from "@/lib/types";

/**
 * SERVER-side Pump.fun launches client (public, keyless).
 * Uses the officially exposed frontend API with conservative caching.
 */

interface PumpCoin {
  mint: string;
  symbol: string;
  name: string;
  usd_market_cap?: number;
  complete?: boolean;
  creator?: string;
  created_timestamp?: number;
}

export async function fetchPumpLaunches(limit = 20): Promise<Launch[]> {
  return cached(`pumpfun:launches:${limit}`, TTL.SHORT, async () => {
    let coins: PumpCoin[];
    try {
      coins = await httpJson<PumpCoin[]>(
        "PUMP.FUN",
        `https://frontend-api-v3.pump.fun/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`,
        {},
        { retries: 1, timeoutMs: 12_000 }
      );
    } catch (err) {
      throw new DataUnavailableError(
        err instanceof Error ? err.message : "Could not reach the Pump.fun public API."
      );
    }
    return coins.map((c) => ({
      address: c.mint,
      name: c.name,
      ticker: `$${c.symbol}`,
      creatorAddress: c.creator,
      createdAtMs: c.created_timestamp ?? Date.now(),
      marketCapUsd: c.usd_market_cap ?? 0,
      status: c.complete ? "graduated" : "bonding",
      narrativeTag: classifyTokenNarrative(c.name, c.symbol),
      // First-60-second event streams require indexed data (Helius webhooks).
      events: undefined,
    }));
  });
}
