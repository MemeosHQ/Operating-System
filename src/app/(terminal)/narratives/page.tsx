"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type { Narrative, TokenMetrics } from "@/lib/types";
import { useApp } from "@/lib/providers/app-provider";
import { TokenRow } from "@/components/tokens";
import { Badge } from "@/components/ui/kit";
import { ErrorState, SignalLoader } from "@/components/ui/states";
import { NarrativeExplorer } from "@/components/narrative-explorer";
import { fmtPct, fmtUsd, cn } from "@/lib/utils";
import { momentumRankValue } from "@/lib/metrics/narrative-momentum";

/**
 * NARRATIVES — the ideas shaping Solana's meme economy.
 * Narrative Pulse → Featured narrative (editorial) → Narrative Explorer.
 */
export default function NarrativesPage() {
  const { data, loading, error, requiredEnv, retry, fetchedAt } = useApi<Narrative[]>(("/api/narratives"), {
    refreshMs: 60_000,
  });
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens", { refreshMs: 60_000 });
  const { mode } = useApp();
  const [, forceTick] = useReducer((x: number) => x + 1, 0);

  // Re-render each second so the LAST UPDATED age ticks live.
  useEffect(() => {
    const t = setInterval(forceTick, 1000);
    return () => clearInterval(t);
  }, [forceTick]);

  if (loading) {
    return (
      <div className="space-y-8 py-10">
        <SignalLoader label="Sequencing narratives…" />
        <div className="shimmer h-40 rounded-2xl" />
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  }

  // Real data freshness: server-computed snapshot time (generatedAt), falling
  // back to client fetch time. STALE once older than 2× the refresh interval.
  const generatedAtMs = data?.[0]?.generatedAt
    ? Date.parse(data[0].generatedAt)
    : fetchedAt;
  const ageSeconds =
    generatedAtMs !== undefined && generatedAtMs !== null
      ? Math.max(0, Math.floor((Date.now() - generatedAtMs) / 1000))
      : null;
  const stale = ageSeconds !== null && ageSeconds > 120;

  // Ranking: REAL current momentum first; narratives still building baseline
  // rank below by |attention level|. Featured = highest momentum that has a
  // real previous-window comparison; when nothing qualifies we say so honestly.
  const items = [...(data ?? [])].sort(
    (a, b) => momentumRankValue(b) - momentumRankValue(a)
  );
  const qualifying = items.filter((n) => n.momentumPct !== null && n.momentumPct !== undefined);
  const max = Math.max(
    1,
    ...qualifying.map((n) => Math.abs(n.momentumPct ?? 0))
  );
  const featured = qualifying[0];
  const members = featured
    ? (tokens ?? []).filter((t) => featured.tokens.includes(t.address))
    : [];
  const topMembers = [...members]
    .sort((a, b) => (b.attentionVelocity ?? 0) - (a.attentionVelocity ?? 0))
    .slice(0, 5);
  const notableCount = members.filter((t) => (t.notableWallets ?? 0) > 0).length;
  const creatorCount = new Set(members.map((t) => t.creatorAddress).filter(Boolean)).size;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="fade-up space-y-2 px-1 pt-2">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-faint">
          <span className="font-bold tracking-[0.32em] text-ink">NARRATIVES</span>
          <span className="h-px w-8 bg-edge2" />
          <Badge tone={mode === "live" ? "live" : "warn"}>
            {mode === "live" ? "Solana Live" : "Demo"}
          </Badge>
          {mode === "live" && stale && (
            <Badge tone="warn">Data delayed {ageSeconds !== null ? `${ageSeconds}s` : ""}</Badge>
          )}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
          {ageSeconds !== null
            ? `Last updated ${ageSeconds}s ago · refreshes every 60s · ${mode === "live" ? (stale ? "stale — upstream delayed" : "live") : "demo"}`
            : "refreshes every 60s"}
        </div>
        <h1 className="max-w-2xl text-[28px] font-bold leading-[1.1] tracking-tight text-ink md:text-[36px]">
          The ideas shaping Solana&apos;s meme economy.
        </h1>
      </div>

      {/* Narrative Pulse */}
      <section>
        <div className="mb-4 flex items-baseline gap-2 px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-ink">
            Narrative <span className="text-signal">Pulse</span>
          </h2>
          <span className="text-[11px] text-faint">momentum vs. previous 5–20 min window · ranked by real momentum</span>
        </div>
        <div className="space-y-4 rounded-2xl border border-edge bg-surface/60 p-6">
          {items.map((n, i) => {
            const building = n.momentumStatus === "BUILDING_BASELINE" || n.momentumPct === null;
            const pct = building ? null : (n.momentumPct ?? 0);
            const dominant = i === 0;
            return (
              <Link key={n.slug} href={`/narrative/${n.slug}`} className="group block">
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      "font-semibold tracking-tight",
                      dominant ? "text-[18px] text-ink" : "text-[13px] text-muted group-hover:text-ink"
                    )}
                  >
                    {n.name.toUpperCase()}
                    <span className="ml-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                      {building
                        ? "building baseline"
                        : `${n.momentumStatus} · ${n.tokenCount} tokens · ${fmtUsd(n.volume24hUsd)}`}
                    </span>
                  </span>
                  {building ? (
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                      insufficient data
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "font-mono font-bold tabular-nums",
                        dominant ? "text-[18px]" : "text-[13px]",
                        (pct ?? 0) >= 0 ? "text-up" : "text-down"
                      )}
                      title="Narrative momentum vs. previous 5–20 min window (volume/txns/attention-weighted)"
                    >
                      {fmtPct(pct ?? 0)}
                    </span>
                  )}
                </div>
                {!building && (
                  <div className={cn("mt-1.5 overflow-hidden rounded-full bg-edge/60", dominant ? "h-2.5" : "h-1.5")}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        (pct ?? 0) >= 0
                          ? "bg-gradient-to-r from-accent via-signal to-up"
                          : "bg-gradient-to-r from-down/60 to-down",
                        dominant && "shadow-[0_0_16px_rgba(56,189,248,0.35)]"
                      )}
                      style={{
                        width: `${Math.max(4, (Math.abs(pct ?? 0) / max) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured narrative — editorial */}
      {!featured && items.length > 0 && (
        <div className="rounded-2xl border border-edge bg-surface/60 px-6 py-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
            Building market baseline
          </div>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted">
            MEMEOS is collecting real market snapshots for these narratives.
            Momentum rankings appear once a previous 5–20 minute window exists
            to compare against — usually within minutes of live operation.
          </p>
        </div>
      )}
      {featured && (
        <section>
          <div className="border-l-2 border-signal pl-5 md:pl-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
              Featured narrative
            </div>
            <h2 className="mt-3 text-[36px] font-bold leading-none tracking-tight text-ink md:text-[52px]">
              {featured.name.toUpperCase()}
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">
              {featured.description}
            </p>
            <div className="mt-6 flex flex-wrap items-baseline gap-10">
              <div>
                <div
                  className={cn(
                    "font-mono text-[36px] font-bold leading-none tabular-nums",
                    (featured.momentumPct ?? 0) >= 0 ? "text-up" : "text-down"
                  )}
                  title="Momentum vs. previous 5–20 min window"
                >
                  {featured.momentumPct !== null && featured.momentumPct !== undefined
                    ? fmtPct(featured.momentumPct)
                    : "—"}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-faint">
                  momentum · {featured.momentumStatus ?? "building"}
                </div>
              </div>
              <div>
                <div className="font-mono text-[36px] font-bold leading-none tabular-nums text-ink">
                  {featured.attentionDeltaPct >= 0 ? fmtPct(featured.attentionDeltaPct) : fmtPct(featured.attentionDeltaPct)}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-faint">attention level</div>
              </div>
              <div>
                <div className="font-mono text-[36px] font-bold leading-none tabular-nums text-ink">
                  {featured.tokenCount}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-faint">tokens</div>
              </div>
              <div>
                <div className="font-mono text-[36px] font-bold leading-none tabular-nums text-ink">
                  {fmtUsd(featured.volume24hUsd)}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-faint">24h volume</div>
              </div>
              <div>
                <div className="font-mono text-[36px] font-bold leading-none tabular-nums text-ink">
                  {featured.newLaunches24h}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-faint">new 24h</div>
              </div>
            </div>
          </div>

          {/* Featured intelligence */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-2 px-1 text-[11px] uppercase tracking-[0.2em] text-faint">Top tokens</div>
              <div className="overflow-hidden rounded-xl border border-edge bg-surface">
                {topMembers.length === 0 ? (
                  <p className="px-4 py-6 text-[12px] text-faint">No member tokens in view.</p>
                ) : (
                  topMembers.map((t) => <TokenRow key={t.address} token={t} />)
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-edge bg-surface/60 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-faint">Wallet activity</div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {notableCount > 0
                    ? `Notable-wallet activity observed in ${notableCount} of ${members.length} member tokens.`
                    : "No notable-wallet activity observed across member tokens."}
                </p>
              </div>
              <div className="rounded-xl border border-edge bg-surface/60 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-faint">Creator activity</div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {creatorCount} distinct creator address{creatorCount === 1 ? "" : "es"} observed here.{" "}
                  <Link href="/creators" className="text-signal hover:underline">
                    Creator records →
                  </Link>
                </p>
              </div>
              <div className="rounded-xl border border-edge bg-surface/60 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-faint">✦ AI insight</div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  <Link href="/ai" className="text-signal hover:underline">
                    Ask the Analyst
                  </Link>{" "}
                  which narratives are accelerating — answers label observed vs. calculated
                  vs. interpretation.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Explorer */}
      <NarrativeExplorer items={items} />
    </div>
  );
}
