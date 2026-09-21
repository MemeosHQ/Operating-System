import "server-only";
import { httpJson } from "@/lib/server/http";
import { cached, TTL } from "@/lib/server/cache";
import { DataUnavailableError } from "@/lib/errors";
import { HELIUS_API_KEY, heliusConfigured } from "@/lib/server/env";

/**
 * SERVER-side Helius client — the primary production Solana infrastructure.
 * - RPC:        https://mainnet.helius-rpc.com/?api-key=KEY (standard JSON-RPC)
 * - Enhanced:   https://api.helius.xyz/v0/addresses/{ADDR}/transactions (parsed history)
 * - DAS:        getAsset via RPC for token metadata
 * Key stays server-side. All calls cached; batched where sensible.
 */

const HELIUS_RPC = "https://mainnet.helius-rpc.com";
const HELIUS_API = "https://api.helius.xyz";

export function heliusRpcUrl(): string {
  return heliusConfigured() ? `${HELIUS_RPC}/?api-key=${HELIUS_API_KEY}` : "";
}

export interface HeliusTxEvent {
  signature: string;
  timestamp: number;
  type: string;
  feePayer?: string;
  tokenTransfers?: {
    fromUserAccount?: string;
    toUserAccount?: string;
    mint?: string;
    tokenAmount?: number;
  }[];
  events?: {
    swap?: {
      nativeInput?: { amount?: string };
      nativeOutput?: { amount?: string };
      tokenInputs?: { mint?: string; tokenAmount?: number }[];
      tokenOutputs?: { mint?: string; tokenAmount?: number }[];
    };
  };
}

export interface ParsedWalletTrade {
  signature: string;
  timestamp: number;
  kind: "buy" | "sell" | "transfer" | "other";
  mint?: string;
  tokenAmount?: number;
  solAmount?: number;
  counterparty?: string;
}

function classifyTx(tx: HeliusTxEvent, wallet: string): ParsedWalletTrade {
  const swap = tx.events?.swap;
  const solIn = Number(swap?.nativeOutput?.amount ?? 0) / 1_000_000_000;
  const solOut = Number(swap?.nativeInput?.amount ?? 0) / 1_000_000_000;
  if (swap && (solIn > 0 || solOut > 0)) {
    const out = swap.tokenOutputs?.find((o) => o.mint);
    const input = swap.tokenInputs?.find((i) => i.mint);
    const bought = solOut > solIn;
    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      kind: bought ? "buy" : "sell",
      mint: (bought ? out?.mint : input?.mint) ?? undefined,
      tokenAmount: (bought ? out?.tokenAmount : input?.tokenAmount) ?? undefined,
      solAmount: bought ? solOut : solIn,
    };
  }
  const tt = tx.tokenTransfers?.find(
    (t) => t.fromUserAccount === wallet || t.toUserAccount === wallet
  );
  if (tt) {
    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      kind: "transfer",
      mint: tt.mint,
      tokenAmount: tt.tokenAmount,
      counterparty:
        tt.fromUserAccount === wallet ? tt.toUserAccount : tt.fromUserAccount,
    };
  }
  return { signature: tx.signature, timestamp: tx.timestamp, kind: "other" };
}

export async function getWalletTransactions(
  address: string,
  limit = 25
): Promise<ParsedWalletTrade[]> {
  if (!heliusConfigured()) {
    throw new DataUnavailableError(
      "Parsed wallet history requires HELIUS_API_KEY (server-side Enhanced Transactions API).",
      ["HELIUS_API_KEY"]
    );
  }
  return cached(`helius:txs:${address}:${limit}`, TTL.SHORT, async () => {
    const txs = await httpJson<HeliusTxEvent[]>(
      "HELIUS",
      `${HELIUS_API}/v0/addresses/${encodeURIComponent(address)}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`,
      {},
      { retries: 1, timeoutMs: 12_000 }
    );
    return txs.map((t) => classifyTx(t, address));
  });
}

/** DAS getAsset — on-chain token metadata (name, symbol, image, creation). */
export interface HeliusTokenMeta {
  name?: string;
  symbol?: string;
  imageUri?: string;
  createdAtMs?: number;
}

interface DasAsset {
  id?: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: { uri?: string; cdn_uri?: string; mime?: string }[];
  };
  timestamp?: number;
}

/** Extract the image from the actual DAS response shape, in priority order. */
function extractImage(asset: DasAsset): string | undefined {
  return (
    asset.content?.links?.image ??
    asset.content?.files?.find((f) => f.uri)?.uri ??
    asset.content?.files?.find((f) => f.cdn_uri)?.cdn_uri ??
    asset.content?.files?.find((f) => f.mime?.startsWith("image"))?.uri ??
    undefined
  );
}

function extractMeta(asset: DasAsset): HeliusTokenMeta {
  return {
    name: asset.content?.metadata?.name,
    symbol: asset.content?.metadata?.symbol,
    imageUri: extractImage(asset),
    createdAtMs: asset.timestamp ? asset.timestamp * 1000 : undefined,
  };
}

export async function getTokenMetadata(mint: string): Promise<HeliusTokenMeta | undefined> {
  if (!heliusConfigured()) return undefined;
  return cached(`helius:asset:${mint}`, TTL.LONG, async () => {
    try {
      const asset = await httpJson<DasAsset>(
        "HELIUS",
        heliusRpcUrl(),
        {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "das",
            method: "getAsset",
            params: { id: mint },
          }),
          headers: { "content-type": "application/json" },
        },
        { retries: 1, timeoutMs: 10_000 }
      );
      return extractMeta(asset);
    } catch {
      return undefined;
    }
  });
}

/**
 * BATCH DAS metadata (getAssetBatch — one request for up to 100 mints).
 * Powers list-wide logo enrichment without per-token RPC spam.
 */
export async function getBatchTokenMetadata(
  mints: string[]
): Promise<Map<string, HeliusTokenMeta>> {
  const out = new Map<string, HeliusTokenMeta>();
  if (!heliusConfigured() || mints.length === 0) return out;
  const uncached = mints.filter((m) => !outCache.has(m));
  if (uncached.length > 0) {
    const key = `helius:batch:${uncached.map((m) => m.slice(0, 8)).join(",")}`;
    try {
      await cached(key, TTL.LONG, async () => {
        for (let i = 0; i < uncached.length; i += 100) {
          const chunk = uncached.slice(i, i + 100);
          const res = await httpJson<{ result?: DasAsset[] }>(
            "HELIUS",
            heliusRpcUrl(),
            {
              method: "POST",
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: "das-batch",
                method: "getAssetBatch",
                params: { ids: chunk },
              }),
              headers: { "content-type": "application/json" },
            },
            { retries: 1, timeoutMs: 12_000 }
          );
          (res.result ?? []).forEach((asset, idx) => {
            const mint = chunk[idx];
            if (mint) outCache.set(mint, extractMeta(asset));
          });
        }
        return true;
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[memeos:logos] getAssetBatch unavailable:", err instanceof Error ? err.message : err);
      }
    }
  }
  for (const m of mints) {
    const v = outCache.get(m);
    if (v && (v.imageUri || v.name)) out.set(m, v);
  }
  return out;
}

/** Cross-request metadata cache (per mint) so lists never re-request. */
const outCache = new Map<string, HeliusTokenMeta>();

/** Launch replay from parsed on-chain history — the first 60 seconds of a mint. */
export interface ReplayEvent {
  tSeconds: number;
  label: string;
  kind: string;
  buyer?: string;
  sol?: number;
}

export async function getFirst60sEvents(mint: string): Promise<ReplayEvent[]> {
  if (!heliusConfigured()) {
    throw new DataUnavailableError(
      "Launch replay requires HELIUS_API_KEY (parsed on-chain history for the mint).",
      ["HELIUS_API_KEY"]
    );
  }
  return cached(`helius:launch:${mint}`, TTL.MED, async () => {
    const txs = await httpJson<HeliusTxEvent[]>(
      "HELIUS",
      `${HELIUS_API}/v0/addresses/${encodeURIComponent(mint)}/transactions?api-key=${HELIUS_API_KEY}&limit=100`,
      {},
      { retries: 1, timeoutMs: 12_000 }
    );
    if (txs.length === 0) {
      throw new DataUnavailableError("No on-chain history found for this mint yet.");
    }
    const created = Math.min(...txs.map((t) => t.timestamp));
    const window = txs
      .filter((t) => t.timestamp - created <= 60)
      .sort((a, b) => a.timestamp - b.timestamp);
    const events: ReplayEvent[] = [
      { tSeconds: 0, label: "Token launched", kind: "launch" },
    ];
    const buyers = new Set<string>();
    for (const tx of window) {
      const t = tx.timestamp - created;
      const swap = tx.events?.swap;
      const sol = Number(swap?.nativeInput?.amount ?? 0) / 1_000_000_000;
      const buyer = tx.feePayer ?? "";
      if (swap && sol > 0) {
        buyers.add(buyer);
        events.push({
          tSeconds: t,
          label: buyers.size === 1 ? "First buyer" : `${buyers.size} buyers`,
          kind: "buyers",
          buyer,
          sol,
        });
        if (sol >= 10) {
          events.push({
            tSeconds: t,
            label: "Whale detected",
            kind: "whale",
            buyer,
            sol,
          });
        }
      } else if (tx.type.toLowerCase() === "create") {
        continue;
      } else {
        events.push({
          tSeconds: t,
          label: `Activity: ${tx.type.toLowerCase()}`,
          kind: "activity",
        });
      }
    }
    events.push({ tSeconds: 60, label: "Launch snapshot", kind: "snapshot" });
    return events;
  });
}

export async function heliusHealthy(): Promise<boolean> {
  if (!heliusConfigured()) return false;
  try {
    return await cached("helius:health", TTL.SHORT, async () => {
      const slot = await httpJson<{ result: number }>(
        "HELIUS",
        heliusRpcUrl(),
        {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getSlot",
            params: [{ commitment: "confirmed" }],
          }),
          headers: { "content-type": "application/json" },
        },
        { retries: 0, timeoutMs: 6_000 }
      );
      return typeof slot.result === "number" && slot.result > 0;
    });
  } catch {
    return false;
  }
}
