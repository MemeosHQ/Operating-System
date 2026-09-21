"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { HealthReport } from "@/lib/types";
import { StatusDot } from "@/components/ui/kit";

/** Bottom status bar backed by the REAL /api/health endpoint. */
export function StatusBar() {
  const { data: health } = useApi<HealthReport>("/api/health", { refreshMs: 30_000 });
  if (!health) {
    return (
      <footer className="flex items-center gap-4 border-t border-edge px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
        <span>status: checking…</span>
      </footer>
    );
  }
  const ago = Math.max(0, Math.round((Date.now() - health.checksAt) / 1000));
  const dot = (ok: boolean) => (
    <StatusDot tone={ok ? "live" : "down"} pulse={false} />
  );
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-edge px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
      <span className="flex items-center gap-1.5">
        Solana {dot(health.rpc === "connected")} {health.rpc}
      </span>
      <span className="flex items-center gap-1.5">
        Data {dot(health.data === "live")} {health.data}
      </span>
      <span className="flex items-center gap-1.5">
        PumpFun {dot(health.pumpfun === "connected")} {health.pumpfun}
      </span>
      <span className="flex items-center gap-1.5">
        DexScreener {dot(health.dexscreener === "connected")} {health.dexscreener}
      </span>
      <span className="ml-auto normal-case">Last update: {ago}s ago</span>
    </footer>
  );
}
