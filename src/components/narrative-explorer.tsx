"use client";

import Link from "next/link";
import type { Narrative } from "@/lib/types";
import { Badge } from "@/components/ui/kit";
import { fmtPct, fmtUsd, cn } from "@/lib/utils";

/** Narrative Explorer — typographic momentum table ranked by real momentum. */

function statusBadge(
  n: Narrative
): { label: string; tone: "up" | "accent" | "down" | "neutral" | "warn" } {
  if (n.momentumPct === null || n.momentumPct === undefined || n.momentumStatus === "BUILDING_BASELINE") {
    return { label: "BUILDING BASELINE", tone: "warn" };
  }
  const p = n.momentumPct;
  if (p >= 25) return { label: "ACCELERATING", tone: "up" };
  if (p >= 5) return { label: "RISING", tone: "accent" };
  if (p > -5) return { label: "STEADY", tone: "neutral" };
  if (p > -25) return { label: "COOLING", tone: "warn" };
  return { label: "FADING", tone: "down" };
}

export function NarrativeExplorer({ items }: { items: Narrative[] }) {
  return (
    <section>
      <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.2em] text-faint">
        Narrative explorer — momentum vs. previous 5–20 min window
      </div>
      <div className="overflow-hidden rounded-xl border border-edge bg-surface">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr_0.9fr] gap-2 border-b border-edge px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint sm:grid">
          <span>Narrative</span>
          <span className="text-right">Momentum</span>
          <span className="text-right">Attention</span>
          <span className="text-right">Tokens</span>
          <span className="text-right">Volume</span>
          <span className="text-right">New</span>
          <span className="text-right">Status</span>
        </div>
        {items.map((n) => {
          const st = statusBadge(n);
          const building = n.momentumPct === null || n.momentumPct === undefined;
          return (
            <Link
              key={n.slug}
              href={`/narrative/${n.slug}`}
              className="row-sep grid grid-cols-2 gap-2 px-4 py-3 transition-colors hover:bg-surface2/60 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr_0.9fr]"
            >
              <span className="text-[13px] font-semibold text-ink">{n.name}</span>
              <span
                className={cn(
                  "text-right font-mono text-[13px] font-bold tabular-nums",
                  building ? "text-faint" : n.momentumPct! >= 0 ? "text-up" : "text-down"
                )}
                title="Momentum vs. previous 5–20 min window"
              >
                {building ? "—" : fmtPct(n.momentumPct!)}
              </span>
              <span
                className={cn(
                  "text-right font-mono text-[12px] tabular-nums",
                  n.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                )}
                title="Attention level vs. neutral velocity baseline"
              >
                {fmtPct(n.attentionDeltaPct)}
              </span>
              <span className="text-right font-mono text-[12px] tabular-nums text-muted">
                {n.tokenCount}
              </span>
              <span className="text-right font-mono text-[12px] tabular-nums text-muted">
                {fmtUsd(n.volume24hUsd)}
              </span>
              <span className="text-right font-mono text-[12px] tabular-nums text-muted">
                {n.newLaunches24h}
              </span>
              <span className="text-right">
                <Badge tone={st.tone}>{st.label}</Badge>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[10px] text-faint">
        Momentum = weighted change vs. a real previous 5–20 min snapshot: volume accel (0.50) +
        transaction accel (0.30) + attention change (0.15) + launch growth (0.05), clamped ±300.
        BUILDING BASELINE = not enough prior observations yet — never a fake −100% or 0%.
      </p>
    </section>
  );
}
