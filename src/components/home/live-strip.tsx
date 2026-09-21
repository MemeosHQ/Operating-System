"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { Narrative, TokenMetrics } from "@/lib/types";
import { fmtUsd } from "@/lib/utils";

/**
 * LIVE INTELLIGENCE STRIP — real signals from the running MEMEOS system.
 * Renders only actual API data; unavailable values show an honest state.
 */

interface HealthLike {
  data?: { rpc?: string; dexscreener?: string; pumpfun?: string; database?: string };
}

export function LiveIntelligenceStrip({ mode }: { mode: "live" | "demo" }) {
  const { data: health } = useApi<HealthLike>("/api/health", { refreshMs: 60_000 });
  const { data: narratives } = useApi<Narrative[]>("/api/narratives", { refreshMs: 60_000 });
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens", { refreshMs: 60_000 });

  const providers = [
    ["SOLANA", health?.data?.rpc],
    ["MARKETS", health?.data?.dexscreener],
    ["LAUNCHES", health?.data?.pumpfun],
    ["INTELLIGENCE DB", health?.data?.database],
  ] as const;
  const connected = providers.filter(([, s]) => s === "connected").length;

  const topNarrative = [...(narratives ?? [])]
    .filter((n) => n.momentumPct !== null && n.momentumPct !== undefined)
    .sort((a, b) => (b.momentumPct ?? 0) - (a.momentumPct ?? 0))[0];
  const tracked = tokens?.length ?? 0;

  return (
    <section aria-label="Live intelligence" className="border-y border-edge bg-surface/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-3 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.22em]">
        <span className={mode === "live" ? "text-live" : "text-warn"}>
          ● {mode === "live" ? "Live" : "Demo"} · {connected}/{providers.length} systems
        </span>
        <span className="text-faint">
          Attention:{" "}
          <span className="text-ink">
            {tracked > 0 ? `${tracked} tokens in view` : "connecting…"}
          </span>
        </span>
        <span className="text-faint">
          Narratives:{" "}
          <span className="text-ink">
            {narratives?.length ? `${narratives.length} tracked` : "—"}
          </span>
        </span>
        {topNarrative && (
          <Link
            href={`/narrative/${topNarrative.slug}`}
            className="text-faint transition-colors hover:text-ink"
          >
            Leading: <span className="text-accent-soft">{topNarrative.name}</span>{" "}
            <span className="text-muted">
              {topNarrative.momentumStatus} · {fmtUsd(topNarrative.volume24hUsd)}
            </span>
          </Link>
        )}
        <span className="ml-auto text-faint">
          {mode === "live"
            ? "MEMEOS is connected to the market"
            : "Demo mode — sample data, clearly labeled"}
        </span>
      </div>
    </section>
  );
}
