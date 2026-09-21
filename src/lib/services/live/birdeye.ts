import "server-only";
import { httpJson } from "@/lib/server/http";
import { cached, TTL } from "@/lib/server/cache";
import { DataUnavailableError } from "@/lib/errors";

/**
 * SERVER-side Birdeye client (optional — gated on BIRDEYE_API_KEY).
 * Provides real holder counts for Meme DNA holder-quality scoring.
 */

export const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY?.trim() ?? "";

export function birdeyeConfigured() {
  return Boolean(BIRDEYE_API_KEY);
}

interface BirdeyeTokenOverview {
  data?: { holder?: number };
}

export async function fetchHolderCount(mint: string): Promise<number | undefined> {
  if (!birdeyeConfigured()) {
    throw new DataUnavailableError(
      "Holder analytics require BIRDEYE_API_KEY (server-side).",
      ["BIRDEYE_API_KEY"]
    );
  }
  return cached(`birdeye:holders:${mint}`, TTL.MED, async () => {
    try {
      const json = await httpJson<BirdeyeTokenOverview>(
        "BIRDEYE",
        `https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(mint)}`,
        { headers: { "X-API-KEY": BIRDEYE_API_KEY, chain: "solana" } },
        { retries: 1, timeoutMs: 10_000 }
      );
      return json.data?.holder;
    } catch {
      return undefined;
    }
  });
}
