"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useApp } from "@/lib/providers/app-provider";
import { StatusDot } from "@/components/ui/kit";
import { MemeosMark, MemeosWordmark } from "@/components/brand/memeos-logo";
import { useApi } from "@/lib/hooks/use-api";
import type { HealthReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SOLANA_CLUSTER_LABEL } from "@/lib/config";
import { WalletMenu } from "@/components/wallet/wallet-menu";

/**
 * Command bar: brand · search/command (opens palette, "/" shortcut) ·
 * cluster + live status · wallet control · AI.
 */
export function Topbar() {
  const { mode, setSearchOpen } = useApp();
  const { data: health } = useApi<HealthReport>("/api/health", { refreshMs: 30_000 });

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-void/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-2 md:px-6">
        {/* Left — brand */}
        <Link href="/terminal" className="flex shrink-0 items-center gap-2" title="MEMEOS">
          <MemeosMark height={12} />
          <MemeosWordmark height={11} className="hidden md:block" />
        </Link>

        {/* Center — command input */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group mx-auto flex w-full max-w-md items-center gap-2.5 rounded-full border border-edge2 bg-surface2/70 px-4 py-1.5 text-left transition-colors hover:border-accent/50 hover:bg-surface2"
          aria-label="Open search and command palette"
        >
          <Search size={13} className="shrink-0 text-faint transition-colors group-hover:text-accent-soft" />
          <span className="truncate text-[12px] text-faint transition-colors group-hover:text-muted">
            Search token, wallet, narrative...
          </span>
          <kbd className="ml-auto shrink-0 rounded border border-edge2 px-1.5 py-px font-mono text-[10px] text-faint">
            ⌘K
          </kbd>
        </button>

        {/* Right — cluster · wallet · AI */}
        <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
          <span
            className="hidden items-center gap-1.5 text-faint lg:flex"
            title={`Wallets connect on the configured cluster (${SOLANA_CLUSTER_LABEL})`}
          >
            {SOLANA_CLUSTER_LABEL}
            <StatusDot tone="live" pulse={false} />
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            Solana
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5",
                mode === "live" ? "border-live/30 text-live" : "border-warn/30 text-warn"
              )}
            >
              <StatusDot tone={mode === "live" ? "live" : "warn"} pulse={mode === "live"} />
              {mode === "live" ? "Live" : "Demo"}
            </span>
          </span>
          <span
            className="hidden items-center gap-1.5 text-faint sm:flex"
            title={health ? `RPC ${health.rpc} · pump.fun ${health.pumpfun} · dexscreener ${health.dexscreener}` : "checking RPC…"}
          >
            RPC
            <StatusDot
              tone={health ? (health.rpc === "connected" ? "live" : "down") : "warn"}
              pulse={false}
            />
          </span>
          <WalletMenu />
          <Link
            href="/ai"
            className="flex items-center gap-1 rounded-full border border-accent/40 px-2.5 py-0.5 text-accent-soft transition-colors hover:bg-accent/15"
            title="MEMEOS AI Analyst"
          >
            ✦ AI
          </Link>
        </div>
      </div>
    </header>
  );
}

