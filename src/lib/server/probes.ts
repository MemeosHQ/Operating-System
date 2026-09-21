import "server-only";
import { httpJson } from "@/lib/server/http";
import { DEXSCREENER_API_URL } from "@/lib/config";

/** Shared upstream connectivity probes — used by /api/health and provider health(). */

export async function probeDexscreener(): Promise<"connected" | "down"> {
  try {
    await httpJson(
      "DEXSCREENER",
      `${DEXSCREENER_API_URL}/latest/dex/search?q=SOL`,
      {},
      { retries: 0, timeoutMs: 6_000 }
    );
    return "connected";
  } catch {
    return "down";
  }
}

export async function probePumpfun(): Promise<"connected" | "down"> {
  try {
    await httpJson(
      "PUMP.FUN",
      "https://frontend-api-v3.pump.fun/coins?offset=0&limit=1&sort=created_timestamp&order=DESC&includeNsfw=false",
      {},
      { retries: 0, timeoutMs: 6_000 }
    );
    return "connected";
  } catch {
    return "down";
  }
}
