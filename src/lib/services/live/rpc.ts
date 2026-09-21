import "server-only";
import { SOLANA_RPC_URL } from "@/lib/config";
import { httpJson } from "@/lib/server/http";
import { cached, TTL } from "@/lib/server/cache";

/**
 * SERVER-side Solana JSON-RPC client (used for health + basic account reads).
 * Public RPC fallback is rate-limited; callers must cache aggressively.
 */

export async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  return httpJson<{ result: T }>(
    "SOLANA RPC",
    SOLANA_RPC_URL,
    {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      headers: { "content-type": "application/json" },
    },
    { retries: 1, timeoutMs: 8_000 }
  ).then((r) => r.result);
}

export async function rpcHealthy(): Promise<boolean> {
  try {
    return await cached("rpc:health", TTL.SHORT, async () => {
      const slot = await rpcCall<number>("getSlot", [{ commitment: "confirmed" }]);
      return typeof slot === "number" && slot > 0;
    });
  } catch {
    return false;
  }
}

export async function getSolBalance(address: string): Promise<number | undefined> {
  try {
    const res = await rpcCall<{ value: number }>("getBalance", [address]);
    return res.value / 1_000_000_000;
  } catch {
    return undefined;
  }
}
