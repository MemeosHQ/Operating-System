"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { AttentionPayload, DnaProfile, Narrative, TokenMetrics } from "@/lib/types";
import { useApp } from "@/lib/providers/app-provider";
import { cn, fmtPct } from "@/lib/utils";
import { Badge } from "@/components/ui/kit";
import { usdCompact } from "./hero-console";

/**
 * PRODUCT PREVIEW — a large browser-window rendering real MEMEOS surfaces
 * (attention streams, trending tokens, live signals, DNA) from the live data layer.
 */
export function ProductPreview() {
  const { data: narratives } = useApi<Narrative[]>("/api/narratives");
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const { data: attention } = useApi<AttentionPayload>("/api/attention");
  const { mode } = useApp();

  const ns = [...(narratives ?? [])].sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct);
  const ts = tokens ?? [];
  const stateByAddress = new Map((attention?.tokens ?? []).map((a) => [a.address, a.state]));
  const trending = [...ts]
    .sort((a, b) => (b.attentionVelocity ?? 0) - (a.attentionVelocity ?? 0))
    .slice(0, 5);
  const sample = trending[0];
  const { data: dna } = useApi<DnaProfile>(sample ? `/api/dna/${sample.address}` : "/api/dna?q=none");
  const dims = (dna?.dimensions ?? []).slice(0, 5);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(ellipse_55%_55%_at_50%_45%,rgba(56,189,248,0.07),transparent)]" />
      <div className="overflow-hidden rounded-2xl border border-edge2 bg-surface shadow-[0_32px_110px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3 border-b border-edge bg-surface2/80 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-edge2" />
            <span className="h-2.5 w-2.5 rounded-full bg-edge2" />
            <span className="h-2.5 w-2.5 rounded-full bg-edge2" />
          </span>
          <span className="mx-auto flex items-center gap-2 rounded-full border border-edge bg-void/60 px-4 py-1 font-mono text-[11px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" aria-hidden />
            memeos.ai/terminal
          </span>
          <Badge tone={mode === "live" ? "live" : "warn"}>{mode === "live" ? "live" : "demo"}</Badge>
        </div>

        <div className="grid gap-px border-b border-edge bg-edge sm:grid-cols-3">
          {ns.slice(0, 3).map((n) => (
            <div key={n.slug} className="bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-muted">{n.name}</span>
                <span
                  className={cn(
                    "font-mono text-[13px] font-bold tabular-nums",
                    n.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                  )}
                >
                  {fmtPct(n.attentionDeltaPct)}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-edge">
                <div
                  className={cn("h-full rounded-full", n.attentionDeltaPct >= 0 ? "bg-up/80" : "bg-down/80")}
                  style={{ width: `${Math.min(100, Math.abs(n.attentionDeltaPct))}%` }}
                />
              </div>
            </div>
          ))}
          {ns.length === 0 && [0, 1, 2].map((i) => <div key={i} className="shimmer bg-surface px-5 py-4" />)}
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1.25fr_0.95fr]">
          <div className="border-b border-edge p-5 lg:border-b-0 lg:border-r">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-signal">live signals</div>
            <div className="mt-3">
              {trending.slice(0, 4).map((t) => {
                const state = stateByAddress.get(t.address) ?? "flat";
                return (
                  <div key={t.address} className="row-sep py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[12px] font-bold text-ink">${t.ticker}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                          state === "exploding"
                            ? "border-up/40 bg-up/10 text-up"
                            : state === "accelerating"
                              ? "border-signal/40 bg-signal/10 text-signal"
                              : state === "cooling"
                                ? "border-warn/40 bg-warn/10 text-warn"
                                : "border-edge2 text-faint"
                        )}
                      >
                        {state}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-faint">
                      {t.narrativeTag} · {usdCompact(t.marketCapUsd)}
                    </div>
                  </div>
                );
              })}
              {trending.length === 0 &&
                [0, 1, 2].map((i) => <div key={i} className="shimmer mb-2 h-10 rounded-md" />)}
            </div>
          </div>

          <div className="border-b border-edge p-5 lg:border-b-0 lg:border-r">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">trending</div>
            <div className="mt-3">
              {trending.map((t, i) => (
                <div
                  key={t.address}
                  className="row-sep group flex items-center gap-3 py-2.5 transition-colors hover:bg-surface2/60"
                  title={t.name}
                >
                  <span className="w-5 font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-16 font-mono text-[12px] font-bold text-ink group-hover:text-signal">
                    ${t.ticker}
                  </span>
                  <span className="flex-1 truncate text-[11px] text-faint">{t.narrativeTag}</span>
                  <span
                    className={cn(
                      "font-mono text-[12px] font-bold tabular-nums",
                      t.priceChange24hPct >= 0 ? "text-up" : "text-down"
                    )}
                  >
                    {fmtPct(t.priceChange24hPct)}
                  </span>
                  <span className="w-14 text-right font-mono text-[11px] tabular-nums text-muted">
                    {usdCompact(t.marketCapUsd)}
                  </span>
                </div>
              ))}
              {trending.length === 0 &&
                [0, 1, 2, 3].map((i) => <div key={i} className="shimmer mb-2 h-8 rounded-md" />)}
            </div>
            <Link href="/terminal" className="mt-3 inline-block text-[11px] text-signal hover:underline">
              open the full terminal →
            </Link>
          </div>

          <div className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">meme dna</div>
            <div className="mt-3">
              {dna && <div className="font-mono text-[13px] font-bold text-ink">${dna.token.ticker}</div>}
              <div className="mt-2.5 space-y-2.5">
                {dims.map((d) => (
                  <div key={d.key} title={d.basis}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-muted">{d.label}</span>
                      <span className="font-mono text-[11px] tabular-nums text-ink">{d.score}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-edge">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          d.score >= 60 ? "bg-up/80" : d.score >= 30 ? "bg-signal/80" : "bg-warn/80"
                        )}
                        style={{ width: `${Math.max(3, d.score)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {dims.length === 0 && [0, 1, 2, 3].map((i) => <div key={i} className="shimmer mb-2 h-5 rounded" />)}
              </div>
              <div className="mt-3 text-[10px] text-faint">every score ships its calculation basis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
