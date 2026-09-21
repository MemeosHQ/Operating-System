"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import {
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SOLANA_CLUSTER, SOLANA_RPC_URL } from "@/lib/config";

/**
 * THE single global Solana wallet context for the whole application.
 * Every page (landing, terminal, all intelligence routes) consumes the same
 * connected-wallet state through @solana/wallet-adapter-react.
 *
 * Explicit adapters cover the wallets that ship with the umbrella package
 * (Phantom, Solflare, Coinbase, Ledger, Torus). Backpack, Glow, Brave and any
 * other Wallet-Standard wallet are detected automatically by the adapter
 * layer's Wallet-Standard registration — they appear in the selector exactly
 * when they are genuinely available, and never otherwise.
 *
 * Read-only by design: no signatures, transactions or approvals are requested
 * for basic access. autoConnect is off — connecting is a deliberate act.
 */

function createAdapters() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ];
}

function rpcEndpoint(): string {
  // A configured env endpoint is used verbatim; the default dev fallback maps
  // to the matching public cluster so wallet and data never disagree.
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()) return SOLANA_RPC_URL;
  return clusterApiUrl(SOLANA_CLUSTER as Exclude<Cluster, "custom">);
}

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(rpcEndpoint, []);
  const wallets = useMemo(createAdapters, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        localStorageKey="memeos.wallet"
        onError={(error) => {
          // Soft adapter events (e.g. account changes) surface here; connect
          // and reject errors are handled inside the wallet selector UI.
          console.warn("[memeos:wallet]", error?.message ?? error);
        }}
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
