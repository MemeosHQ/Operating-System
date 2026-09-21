/** Public (client-safe) configuration. Server-only keys live in /api route handlers. */

function envOr(value: string | undefined, fallback: string) {
  const v = value?.trim();
  return v ? v : fallback;
}

/**
 * Data mode resolution — shared by server and client.
 * MEMEOS_DEMO_MODE=true|false (server-side) wins; then NEXT_PUBLIC_DATA_MODE.
 * On the server this reads MEMEOS_DEMO_MODE at runtime; in the browser bundle
 * it is undefined and the NEXT_PUBLIC fallback / server-provided mode applies.
 */
export const DATA_MODE = (() => {
  const flag = process.env.MEMEOS_DEMO_MODE?.trim().toLowerCase();
  if (flag === "true") return "demo" as const;
  if (flag === "false") return "live" as const;
  const next = (
    process.env.NEXT_PUBLIC_DATA_MODE as "demo" | "live" | undefined
  )?.trim().toLowerCase();
  return next === "live" ? ("live" as const) : ("demo" as const);
})();

export const SOLANA_RPC_URL = envOr(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  "https://api.mainnet-beta.solana.com"
);

/** Target cluster for wallet connections — must match the RPC endpoint above. */
export const SOLANA_CLUSTER = envOr(
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  "mainnet-beta"
) as "mainnet-beta" | "devnet" | "testnet";

export const SOLANA_CLUSTER_LABEL =
  SOLANA_CLUSTER === "mainnet-beta" ? "SOLANA MAINNET" : `SOLANA ${SOLANA_CLUSTER.toUpperCase()}`;

export const DEXSCREENER_API_URL = envOr(
  process.env.NEXT_PUBLIC_DEXSCREENER_API_URL,
  "https://api.dexscreener.com"
);

export function isDemoMode() {
  return DATA_MODE === "demo";
}

/** Official $MEMEOS token mint (public information). Empty/"TBA" = not announced. */
export const MEMEOS_TOKEN_CA = envOr(process.env.NEXT_PUBLIC_MEMEOS_TOKEN_CA, "");

/** Official $MEMEOS buy destination (public URL). Empty = "Coming Soon". */
export const MEMEOS_BUY_URL = envOr(process.env.NEXT_PUBLIC_MEMEOS_BUY_URL, "");

