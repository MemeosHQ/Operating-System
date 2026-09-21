"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useApp } from "@/lib/providers/app-provider";
import { SOLANA_CLUSTER_LABEL } from "@/lib/config";
import { MemeosMark } from "@/components/brand/memeos-logo";

/**
 * WALLET GATE — the terminal stays inaccessible until a supported Solana
 * wallet is connected. Connection alone unlocks access (read-only; no
 * signature, transaction or approval is ever requested).
 */
export function WalletGate({ children }: { children: ReactNode }) {
  const { connecting, connected } = useWallet();
  const { setWalletOpen } = useApp();

  if (connected || connecting) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <MemeosMark height={30} className="mx-auto" />
      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-signal">memeos</div>
      <h1 className="mt-4 max-w-lg text-[30px] font-bold leading-tight tracking-tight text-ink md:text-[38px]">
        Connect your wallet to
        <br />
        enter the terminal.
      </h1>
      <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-muted">
        MEMEOS reads your public address only — to anchor your watchlist and wallet
        intelligence. No signatures, no transactions, no approvals.
      </p>
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" aria-hidden />
        {SOLANA_CLUSTER_LABEL}
      </div>
      <button
        onClick={() => setWalletOpen(true)}
        className="mt-9 rounded-lg bg-accent px-9 py-3.5 text-[13px] font-bold tracking-[0.12em] text-white shadow-[0_0_40px_rgba(123,97,255,0.35)] transition-all hover:bg-accent-soft hover:shadow-[0_0_52px_rgba(123,97,255,0.5)]"
      >
        CONNECT WALLET
      </button>
    </div>
  );
}
