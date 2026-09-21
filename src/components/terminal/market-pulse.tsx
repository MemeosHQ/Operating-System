"use client";

import Link from "next/link";
import type { Narrative } from "@/lib/types";
import { AttentionAreaChart } from "@/components/charts";
import { fmtPct, cn } from "@/lib/utils";

/**
 * MARKET PULSE — the intelligence centerpiece.
 * Each narrative is a flowing signal: name, live sparkline (real timeline
 * data), a signal-line sheen, and its calculated attention delta. The
 * strongest narrative leads with larger type and a wider signal.
 */
export function MarketPulse({ narratives }: { narratives: Narrative[] }) {
  const items = [...narratives]
    .sort((a, b) => Math.abs(b.attentionDeltaPct) - Math.abs(a.attentionDeltaPct))
    .slice(0, 5);
  const max = Math.max(1, ...items.map((n) => Math.abs(n.attentionDeltaPct)));

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">
          Market <span className="text-signal">Pulse</span>
        </h2>
        <span className="text-[11px] text-faint">
          flowing attention per narrative — calculated, not judged
        </span>
      </div>
      <div className="divide-y divide-edge/70">
        {items.map((n, i) => {
          const pct = n.attentionDeltaPct;
          const dominant = i === 0;
          return (
            <Link
              key={n.slug}
              href={`/narrative/${n.slug}`}
              className="group grid grid-cols-[1.1fr_1.6fr_auto] items-center gap-5 py-4 transition-colors hover:bg-surface2/40"
            >
              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate font-semibold tracking-tight",
                    dominant ? "text-[19px] text-ink" : "text-[14px] text-muted group-hover:text-ink"
                  )}
                >
                  {n.name.toUpperCase()}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {n.tokenCount} tokens · {n.newLaunches24h} new
                </div>
              </div>
              <div className="signal-line relative h-11 overflow-hidden rounded-md border border-edge/60 bg-surface/50">
                <AttentionAreaChart data={n.timeline} height={44} />
              </div>
              <div className="w-24 text-right">
                <div
                  className={cn(
                    "font-mono font-bold tabular-nums",
                    dominant ? "text-[26px]" : "text-[18px]",
                    pct >= 0 ? "text-up" : "text-down"
                  )}
                >
                  {fmtPct(pct)}
                </div>
                <div
                  className={cn(
                    "mt-0.5 hidden h-[3px] rounded-full sm:block",
                    pct >= 0 ? "bg-up/60" : "bg-down/60"
                  )}
                  style={{ width: `${Math.max(8, (Math.abs(pct) / max) * 100)}%`, marginLeft: "auto" }}
                />
              </div>
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="py-10 text-center text-[13px] text-faint">Waiting for narrative signals…</p>
        )}
      </div>
    </section>
  );
}
