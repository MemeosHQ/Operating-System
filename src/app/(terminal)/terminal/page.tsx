"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type { AttentionPayload, Narrative } from "@/lib/types";
import { StateGate } from "@/components/ui/states";
import { Badge } from "@/components/ui/kit";
import { MarketPulse } from "@/components/terminal/market-pulse";
import { RightNow, LiveFeed } from "@/components/terminal/feeds";
import { TrendingNow } from "@/components/terminal/trending-now";
import { TokenPanel } from "@/components/token-panel";
import { TokenContractBar } from "@/components/token-contract-bar";
import { useApp } from "@/lib/providers/app-provider";
import { StatusDot } from "@/components/ui/kit";
import { fmtPct, cn } from "@/lib/utils";

/**
 * MEMEOS INTELLIGENCE WORKSPACE — `/terminal`.
 * Editorial intro → MARKET PULSE + RIGHT NOW → TRENDING NOW →
 * NARRATIVE PULSE + LIVE FEED → contextual token drawer.
 * No bubble map. No identical card stacks. Typography-first.
 */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

/** Compact narrative momentum bars (second pulse, below trending). */
function NarrativePulse({ narratives }: { narratives: Narrative[] }) {
  const items = [...narratives]
    .sort((a, b) => Math.abs(b.attentionDeltaPct) - Math.abs(a.attentionDeltaPct))
    .slice(0, 4);
  const max = Math.max(1, ...items.map((n) => Math.abs(n.attentionDeltaPct)));
  return (
    <div className="space-y-3">
      {items.map((n, i) => {
        const dominant = i === 0;
        return (
          <Link key={n.slug} href={`/narrative/${n.slug}`} className="group block">
            <div className="flex items-baseline justify-between">
              <span className={cn("font-semibold tracking-tight", dominant ? "text-[14px] text-ink" : "text-[12px] text-muted group-hover:text-ink")}>
                {n.name.toUpperCase()}
              </span>
              <span className={cn("font-mono text-[13px] font-bold tabular-nums", n.attentionDeltaPct >= 0 ? "text-up" : "text-down")}>
                {fmtPct(n.attentionDeltaPct)}
              </span>
            </div>
            <div className={cn("mt-1 overflow-hidden rounded-full bg-edge/60", dominant ? "h-2" : "h-1")}>
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  n.attentionDeltaPct >= 0 ? "bg-gradient-to-r from-accent via-signal to-up" : "bg-gradient-to-r from-down/60 to-down",
                  dominant && "shadow-[0_0_14px_rgba(56,189,248,0.35)]"
                )}
                style={{ width: `${Math.max(4, (Math.abs(n.attentionDeltaPct) / max) * 100)}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function TerminalWorkspace() {
  const attention = useApi<AttentionPayload>("/api/attention", { refreshMs: 25_000 });
  const narratives = useApi<Narrative[]>("/api/narratives", { refreshMs: 60_000 });
  const { mode } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const items = attention.data?.tokens ?? [];

  return (
    <div className="space-y-10">
      {/* INTRO */}
      <div className="fade-up space-y-2 px-1 pt-2">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-faint">
          <span className="font-bold tracking-[0.32em] text-ink">MEMEOS</span>
          <span className="h-px w-8 bg-edge2" />
          <span className="flex items-center gap-1.5">
            <StatusDot tone={mode === "live" ? "live" : "warn"} pulse={mode === "live"} />
            {mode === "live" ? "Solana Live" : "Demo"}
          </span>
        </div>
        <h1 className="max-w-3xl text-[28px] font-bold leading-[1.12] tracking-tight text-ink md:text-[38px]">
          {greeting()}, SOLANA.
          <br />
          <span className="text-muted">Here&apos;s what&apos;s moving.</span>
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-muted">
          MEMEOS is tracking the attention, wallets and narratives shaping the meme economy.
        </p>
      </div>

      {/* MARKET PULSE | RIGHT NOW */}
      <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr]">
        <StateGate loading={attention.loading} error={attention.error} requiredEnv={attention.requiredEnv} onRetry={attention.retry}>
          <MarketPulse narratives={narratives.data ?? []} />
        </StateGate>
        <aside>
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">
              Right <span className="text-signal">now</span>
            </h2>
            <span className="live-dot h-1 w-1 rounded-full bg-live" />
          </div>
          <StateGate loading={attention.loading} error={attention.error} onRetry={attention.retry}>
            <RightNow items={items} onSelect={setSelected} />
          </StateGate>
        </aside>
      </div>

      {/* TRENDING NOW */}
      <section className="relative">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">
            Trending <span className="text-signal">now</span>
          </h2>
          <Badge tone={mode === "live" ? "live" : "warn"}>{mode === "live" ? "live" : "demo"}</Badge>
        </div>
        <div className="overflow-hidden rounded-xl border border-edge bg-surface/60">
          <StateGate loading={attention.loading} error={attention.error} onRetry={attention.retry}>
            <TrendingNow items={items} onSelect={setSelected} />
          </StateGate>
        </div>
      </section>

      {/* NARRATIVE PULSE | LIVE FEED */}
      <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr]">
        <section>
          <div className="mb-4 flex items-baseline justify-between px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">
              Narrative <span className="text-signal">Pulse</span>
            </h2>
            <span className="text-[11px] text-faint">momentum across the meme economy</span>
          </div>
          <StateGate loading={narratives.loading} error={narratives.error} onRetry={narratives.retry}>
            <div className="rounded-xl border border-edge bg-surface/60 p-5">
              <NarrativePulse narratives={narratives.data ?? []} />
            </div>
          </StateGate>
        </section>
        <section>
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">
              Live <span className="text-signal">feed</span>
            </h2>
            <span className="live-dot h-1 w-1 rounded-full bg-live" />
          </div>
          <StateGate loading={attention.loading} error={attention.error} onRetry={attention.retry}>
            <LiveFeed items={items} onSelect={setSelected} />
          </StateGate>
        </section>
      </div>

      <p className="px-1 pb-2 text-[11px] text-faint">
        Every number here is observed from market data or calculated against each token&apos;s
        own baseline — MEMEOS describes movement, it never issues verdicts.
      </p>

      {/* $MEMEOS token strip — subtle, non-dominant */}
      <div className="flex justify-center border-t border-edge pt-5">
        <TokenContractBar variant="compact" />
      </div>

      {/* Token intelligence drawer */}
      {selected && <TokenPanel address={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

