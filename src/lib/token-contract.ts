import { isSolanaAddress, shortAddr } from "@/lib/utils";
import { MEMEOS_TOKEN_CA, MEMEOS_BUY_URL } from "@/lib/config";

/**
 * MEMEOS TOKEN CONTRACT BAR — state logic (pure, tested).
 *
 * Single source of truth: NEXT_PUBLIC_MEMEOS_TOKEN_CA (public information —
 * a token mint address is not a secret) + NEXT_PUBLIC_MEMEOS_BUY_URL.
 *
 * States:
 *   tba        — no CA configured → display "TBA", copy/buy disabled
 *   configured — valid Solana public key → short address, copy/solscan/buy active
 *   invalid    — CA configured but not a valid Solana address → INVALID CONTRACT
 *
 * Until the official CA is provided, the UI always shows TBA. Nothing here
 * invents, substitutes, or fabricates an address.
 */

export type TokenContractState = "tba" | "configured" | "invalid";

export interface TokenContractInfo {
  state: TokenContractState;
  /** Raw configured value, trimmed ("" when TBA). */
  raw: string;
  /** Shortened display form, e.g. "7xK3…9AqP" (configured only). */
  short?: string;
  /** Solscan token URL (configured only, cluster-aware). */
  solscanUrl?: string;
  /** Buy destination (configured only). */
  buyUrl?: string;
}

const SOLSCAN_BASE = "https://solscan.io/token";

export function resolveTokenContract(
  rawCa: string = MEMEOS_TOKEN_CA,
  rawBuyUrl: string = MEMEOS_BUY_URL
): TokenContractInfo {
  const raw = (rawCa ?? "").trim();
  if (!raw || raw.toUpperCase() === "TBA") {
    return { state: "tba", raw: "" };
  }
  if (!isSolanaAddress(raw)) {
    return { state: "invalid", raw };
  }
  const clusterPath = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : "";
  return {
    state: "configured",
    raw,
    short: shortAddr(raw, 4),
    solscanUrl: `${SOLSCAN_BASE}/${raw}${clusterPath}`,
    buyUrl: (rawBuyUrl ?? "").trim() || undefined,
  };
}
