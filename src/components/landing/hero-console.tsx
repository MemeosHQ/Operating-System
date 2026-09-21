"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { AttentionPayload, Narrative, TokenMetrics } from "@/lib/types";
import { useApp } from "@/lib/providers/app-provider";
import { cn, fmtPct } from "@/lib/utils";
import { Badge } from "@/components/ui/kit";

/** HERO intelligence console + LIVE data strip — all values from the real provider. */

export function usdCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function sparkPath(vals: number[], w: number, h: number): string {
  if (vals.length < 2) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return vals
    .map((v, i) => {
      const x = 2 + (i / (vals.length - 1)) * (w - 4);
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const STATE_STYLE: Record<string, string> = {
  exploding: "text-up",
  accelerating: "text-signal",
  cooling: "text-warn",
  flat: "text-faint",
};

/** The right-side hero visual: a compact live intelligence console. */
export function HeroConsole() {
  const { data: narratives } = useApi<Narrative[]>("/api/narratives");
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const { data: attention } = useApi<AttentionPayload>("/api/attention");
  const { mode } = useApp();

  const ns = [...(narratives ?? [])].sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct);
  const top3 = ns.slice(0, 3);
  const stateByAddress = new Map((attention?.tokens ?? []).map((a) => [a.address, a.state]));
  const hot = [...(tokens ?? [])]
    .sort((a, b) => (b.attentionVelocity ?? 0) - (a.attentionVelocity ?? 0))
    .slice(0, 3);

  const nodes = ["TOKEN", "WALLET", "NARRATIVE", "CREATOR", "AGENT"];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(123,97,255,0.10),transparent)]" />
      <div className="overflow-hidden rounded-2xl border border-edge2 bg-surface/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-edge bg-surface2/70 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-edge2" />
            <span className="h-2 w-2 rounded-full bg-edge2" />
            <span className="h-2 w-2 rounded-full bg-edge2" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            intelligence console
          </span>
          <span className="ml-auto">
            <Badge tone={mode === "live" ? "live" : "warn"}>
              {mode === "live" ? "live" : "demo"}
            </Badge>
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">attention</div>
            <div className="font-mono text-[10px] text-faint">momentum vs prior window</div>
          </div>

          <div className="mt-3">
            {ns.length === 0
              ? [0, 1, 2].map((i) => <div key={i} className="shimmer mb-2 h-9 rounded-lg" />)
              : top3.map((n, i) => (
                  <div
                    key={n.slug}
                    className={cn(
                      "group row-sep flex items-center gap-3 py-2.5 transition-colors",
                      i === 0 && "first:pt-0"
                    )}
                  >
                    <span
                      className={cn(
                        "w-24 truncate font-semibold tracking-tight",
                        i === 0 ? "text-[14px] text-ink" : "text-[12px] text-muted group-hover:text-ink"
                      )}
                    >
                      {n.name}
                    </span>
                    <svg viewBox="0 0 120 30" className="h-[26px] flex-1" aria-hidden>
                      <path
                        d={sparkPath(n.timeline.map((t) => t.attention), 120, 30)}
                        fill="none"
                        stroke={n.attentionDeltaPct >= 0 ? "rgba(47,211,138,0.75)" : "rgba(255,93,108,0.75)"}
                        strokeWidth="1.4"
                      />
                    </svg>
                    <span
                      className={cn(
                        "w-16 text-right font-mono text-[13px] font-bold tabular-nums",
                        n.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                      )}
                    >
                      {fmtPct(n.attentionDeltaPct)}
                    </span>
                  </div>
                ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">top signals</div>
          </div>
          <div className="mt-2">
            {hot.length === 0
              ? [0, 1, 2].map((i) => <div key={i} className="shimmer mb-2 h-7 rounded-md" />)
              : hot.map((t) => {
                  const state = stateByAddress.get(t.address) ?? "flat";
                  return (
                    <div key={t.address} className="row-sep flex items-center gap-3 py-2" title={t.name}>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          state === "exploding"
                            ? "bg-up live-dot"
                            : state === "accelerating"
                              ? "bg-signal"
                              : state === "cooling"
                                ? "bg-warn"
                                : "bg-faint"
                        )}
                        aria-hidden
                      />
                      <span className="w-16 font-mono text-[12px] font-bold text-ink">${t.ticker}</span>
                      <span className="flex-1 truncate text-[11px] text-faint">{t.narrativeTag}</span>
                      <span className="w-14 font-mono text-[11px] tabular-nums text-muted">
                        {usdCompact(t.marketCapUsd)}
                      </span>
                      <span
                        className={cn(
                          "w-12 text-right font-mono text-[11px] tabular-nums",
                          STATE_STYLE[state]
                        )}
                      >
                        {state === "flat" ? "—" : (t.attentionVelocity ?? 0).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
          </div>

          <div className="relative mt-5 overflow-hidden rounded-lg border border-edge bg-void/60 px-3 py-3">
            <div className="flex items-center justify-between gap-1">
              {nodes.map((nd, i) => (
                <div key={nd} className="flex flex-1 items-center">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-1 font-mono text-[8.5px] tracking-[0.14em]",
                      nd === "NARRATIVE"
                        ? "border-signal/40 bg-signal/10 text-signal"
                        : "border-edge2 bg-surface2 text-faint"
                    )}
                  >
                    {nd}
                  </span>
                  {i < nodes.length - 1 && (
                    <span className="signal-line mx-1 h-px flex-1 bg-edge2" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
        rendered from the live memeos data layer
      </p>
    </div>
  );
}

/** Premium live-infrastructure strip directly under the hero. */
export function LiveStrip() {
  const { data: narratives } = useApi<Narrative[]>("/api/narratives");
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const { mode } = useApp();

  const ns = narratives ?? [];
  const ts = tokens ?? [];
  const top = [...ns].sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct)[0];
  const newLaunches = ns.reduce((s, n) => s + n.newLaunches24h, 0);
  const volume = ns.reduce((s, n) => s + n.volume24hUsd, 0);

  const stats: { label: string; value: string; tone?: string }[] = [
    {
      label: mode === "live" ? "SOLANA ● LIVE" : "SOLANA ○ DEMO",
      value: mode === "live" ? "connected" : "sample data",
      tone: mode === "live" ? "text-live" : "text-warn",
    },
    {
      label: "TOP ATTENTION",
      value: top ? fmtPct(top.attentionDeltaPct) : "—",
      tone: top && top.attentionDeltaPct >= 0 ? "text-up" : "text-down",
    },
    { label: "ACTIVE NARRATIVES", value: String(ns.length) },
    { label: "TOKENS TRACKED", value: String(ts.length) },
    { label: "NEW LAUNCHES 24H", value: String(newLaunches) },
    { label: "AGGREGATE 24H VOL", value: usdCompact(volume) },
  ];

  return (
    <div className="border-y border-edge bg-surface/50">
      <div className="mx-auto flex max-w-6xl items-center overflow-x-auto px-5 py-3.5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex shrink-0 items-center gap-2.5 px-5",
              i > 0 && "border-l border-edge"
            )}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              {s.label}
            </span>
            <span className={cn("font-mono text-[13px] font-bold tabular-nums", s.tone ?? "text-ink")}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
