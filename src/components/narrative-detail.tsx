"use client";

import { useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type { AnalystAnswer, Narrative, TokenMetrics } from "@/lib/types";
import { Metric, Badge } from "@/components/ui/kit";
import { ErrorState, SignalLoader } from "@/components/ui/states";
import { AttentionAreaChart } from "@/components/charts";
import { TokenRow } from "@/components/tokens";
import { fmtPct, fmtUsd, cn } from "@/lib/utils";
import { useApp } from "@/lib/providers/app-provider";
import { TAXONOMY } from "@/lib/metrics/narrative";

/**
 * NARRATIVE DETAIL — a premium intelligence report, not an admin page.
 */
export function NarrativeDetail({ slug }: { slug: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<Narrative>(`/api/narratives/${slug}`);
  const allTokens = useApi<TokenMetrics[]>("/api/tokens");
  const { isWatched, toggleWatch, mode } = useApp();
  const [insight, setInsight] = useState<AnalystAnswer | null>(null);
  const [insightBusy, setInsightBusy] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6 py-10">
        <SignalLoader label="Compiling narrative report…" />
        <div className="shimmer h-36 rounded-2xl" />
        <div className="shimmer h-52 rounded-2xl" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  if (!data) return <ErrorState message="Narrative not found." />;
  const n = data;
  const members = (allTokens.data ?? []).filter((t) => n.tokens.includes(t.address));
  const notableCount = members.filter((t) => (t.notableWallets ?? 0) > 0).length;
  const creatorCount = new Set(members.map((t) => t.creatorAddress).filter(Boolean)).size;

  const askInsight = async () => {
    setInsightBusy(true);
    try {
      const res = await fetch("/api/ai/analyst", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What narrative is accelerating?" }),
      });
      const json = await res.json();
      if (json.ok) setInsight(json.data as AnalystAnswer);
    } finally {
      setInsightBusy(false);
    }
  };

  const related = TAXONOMY.filter((x) => x.slug !== n.slug).slice(0, 5);

  return (
    <div className="space-y-12">
      {/* Report header */}
      <div className="fade-up space-y-3 px-1 pt-2">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-faint">
          <span className="font-bold tracking-[0.28em] text-signal">Narrative report</span>
          <span className="h-px w-8 bg-edge2" />
          <Badge tone={mode === "live" ? "live" : "warn"}>
            {mode === "live" ? "Solana Live" : "Demo"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[36px] font-bold leading-none tracking-tight text-ink md:text-[52px]">
              {n.name.toUpperCase()}
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted">{n.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={cn(
                  "font-mono text-[34px] font-bold leading-none tabular-nums",
                  n.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                )}
              >
                {fmtPct(n.attentionDeltaPct)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-faint">Attention</div>
            </div>
            <button
              onClick={() => toggleWatch({ kind: "narrative", id: n.slug, label: n.name })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[12px] transition-colors",
                isWatched("narrative", n.slug)
                  ? "border-accent/50 bg-accent/10 text-accent-soft"
                  : "border-edge2 text-muted hover:border-accent hover:text-ink"
              )}
            >
              {isWatched("narrative", n.slug) ? "★ Watching" : "☆ Watch"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-edge pt-5 sm:grid-cols-4">
          <Metric label="Volume 24h" value={fmtUsd(n.volume24hUsd)} />
          <Metric label="New tokens 24h" value={n.newLaunches24h} />
          <Metric label="Member tokens" value={n.tokenCount} />
          <Metric
            label="Wallet activity"
            value={`${notableCount}/${members.length}`}
            sub="tokens with notable wallets"
          />
        </div>
      </div>

      {/* Attention timeline */}
      <section>
        <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.2em] text-faint">
          Attention timeline
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-4">
          <AttentionAreaChart data={n.timeline} height={160} />
        </div>
      </section>

      {/* Top tokens + wallet/creator activity */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.2em] text-faint">Top tokens</div>
          <div className="overflow-hidden rounded-xl border border-edge bg-surface">
            {members.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-faint">No member tokens in view.</p>
            ) : (
              [...members]
                .sort((a, b) => (b.attentionVelocity ?? 0) - (a.attentionVelocity ?? 0))
                .slice(0, 8)
                .map((t) => <TokenRow key={t.address} token={t} />)
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-edge bg-surface/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-faint">Wallet activity</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {notableCount > 0
                ? `Notable-wallet activity observed in ${notableCount} of ${members.length} member tokens — addresses resolve in /wallets.`
                : "No notable-wallet activity observed across member tokens yet."}
            </p>
          </div>
          <div className="rounded-xl border border-edge bg-surface/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-faint">Creator activity</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {creatorCount} distinct creator address{creatorCount === 1 ? "" : "es"} observed
              in this narrative.{" "}
              <a href="/creators" className="text-signal hover:underline">
                Launch records →
              </a>
            </p>
          </div>
          <div className="rounded-xl border border-edge bg-surface/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-faint">Related narratives</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {related.map((x) => (
                <a
                  key={x.slug}
                  href={`/narrative/${x.slug}`}
                  className="rounded-full border border-edge2 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-signal/50 hover:text-signal"
                >
                  {x.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✦ AI Insight */}
      <section className="glass rounded-2xl border border-edge2 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
              ✦ MemeOS Insight
            </div>
            <p className="mt-1.5 text-[13px] text-muted">
              Ask the analyst about {n.name} — answers distinguish observed data, calculated
              metrics and interpretation.
            </p>
          </div>
          <button
            onClick={askInsight}
            disabled={insightBusy}
            className="rounded-md bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            {insightBusy ? "Analyzing…" : "Generate insight"}
          </button>
        </div>
        {insight && (
          <div className="mt-4 space-y-2 border-t border-edge pt-4">
            <p className="text-[13px] font-medium text-ink">{insight.text}</p>
            {insight.sections.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <Badge tone={s.kind === "observed" ? "up" : s.kind === "calculated" ? "accent" : "warn"}>
                  {s.kind === "ai-interpretation" ? "interpretation" : s.kind}
                </Badge>
                <span className="text-muted">
                  {s.label}: {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
