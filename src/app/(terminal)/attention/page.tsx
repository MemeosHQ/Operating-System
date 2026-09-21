"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { AttentionPayload, AttentionClassification } from "@/lib/types";
import { Panel, PanelHeader, Badge, LinkButton } from "@/components/ui/kit";
import { StateGate } from "@/components/ui/states";
import { TokenRow } from "@/components/tokens";
import { AttentionAreaChart } from "@/components/charts";
import { fmtPct, fmtUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { momentumRankValue } from "@/lib/metrics/narrative-momentum";
import { useApp } from "@/lib/providers/app-provider";
import { useReducer, useEffect } from "react";

/** ATTENTION ENGINE — where is Solana attention moving right now?
 * Narrative-level data comes from the CANONICAL narrative-intelligence
 * service (same snapshots, same momentum, same generatedAt as /narratives).
 * Token-level classification is the separate token attention engine. */

function Section({
  title,
  sub,
  items,
  loading,
  error,
  retry,
}: {
  title: string;
  sub: string;
  items: AttentionClassification[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  return (
    <Panel>
      <PanelHeader title={title} sub={sub} right={<Badge tone="neutral">{items.length}</Badge>} />
      <StateGate loading={loading} error={error} onRetry={retry} isEmpty={items.length === 0} empty={{ title: `Nothing ${title.toLowerCase()} right now` }}>
        <div>
          {items.map((i) => (
            <TokenRow key={i.address} token={i.token} attention={i} />
          ))}
        </div>
      </StateGate>
    </Panel>
  );
}

export default function AttentionPage() {
  // ONE canonical payload: token attention + the SAME narrative state as
  // /narratives (shared service, 20s shared snapshot, same generatedAt).
  const attention = useApi<AttentionPayload>("/api/attention", { refreshMs: 60_000 });

  const items = attention.data?.tokens ?? [];
  const narratives = attention.data?.narratives ?? [];
  const generatedAt = attention.data?.generatedAt;
  const byState = (s: AttentionClassification["state"], sort = true) => {
    const arr = items.filter((i) => i.state === s);
    return sort ? arr.sort((a, b) => b.velocityMultiplier - a.velocityMultiplier) : arr;
  };

  // Canonical ranking — identical to /narratives (momentum first, then |attention|).
  const ranked = [...narratives].sort((a, b) => momentumRankValue(b) - momentumRankValue(a));
  const { mode } = useApp();
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tick]);
  const ageSeconds =
    generatedAt !== undefined ? Math.max(0, Math.floor((Date.now() - Date.parse(generatedAt)) / 1000)) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Attention</h1>
          <p className="mt-1 text-[14px] text-muted">
            Where is Solana attention moving right now?
          </p>
        </div>
        <LinkButton href="/narratives">Narrative view</LinkButton>
      </div>

      <Panel>
        <PanelHeader
          title="Narrative Momentum"
          sub="Canonical engine — momentum vs. previous 5–20 min window (same source as /narratives)"
          right={
            generatedAt ? (
              <Badge tone={mode === "live" ? "live" : "warn"}>
                {mode === "live" ? "Live" : "Demo"} · updated {ageSeconds !== null ? `${ageSeconds}s ago` : ""}
              </Badge>
            ) : undefined
          }
        />
        <StateGate loading={attention.loading} error={attention.error} onRetry={attention.retry} isEmpty={ranked.length === 0} empty={{ title: "No narratives detected yet" }}>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((n) => {
              const building = n.momentumPct === null || n.momentumPct === undefined;
              return (
                <div key={n.slug} className="rounded-lg border border-edge bg-surface2/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">{n.name}</span>
                    {building ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint" title="Not enough prior observations — momentum appears once a previous 5–20 min window exists">
                        Building baseline
                      </span>
                    ) : (
                      <span
                        className={cn("font-mono text-[13px] font-semibold tabular-nums", (n.momentumPct ?? 0) >= 0 ? "text-up" : "text-down")}
                        title={`Momentum vs. previous 5–20 min window · ${n.momentumStatus}`}
                      >
                        {fmtPct(n.momentumPct!)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-faint">
                    {!building && `${n.momentumStatus} · `}
                    {n.tokenCount} tokens · {fmtUsd(n.volume24hUsd)} vol · attention {fmtPct(n.attentionDeltaPct)}
                  </div>
                  <div className="mt-2">
                    <AttentionAreaChart data={n.timeline} height={70} />
                  </div>
                </div>
              );
            })}
          </div>
        </StateGate>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Exploding"
          sub="Rapid changes in volume, buyers and transactions — ≥4× baseline"
          items={byState("exploding")}
          loading={attention.loading}
          error={attention.error}
          retry={attention.retry}
        />
        <Section
          title="Accelerating"
          sub="Beginning to gain momentum — ≥1.6× baseline"
          items={byState("accelerating")}
          loading={attention.loading}
          error={attention.error}
          retry={attention.retry}
        />
        <Section
          title="Cooling"
          sub="Activity slowing vs. the token's own baseline"
          items={byState("cooling")}
          loading={attention.loading}
          error={attention.error}
          retry={attention.retry}
        />
        <Section
          title="Steady"
          sub="No significant attention change"
          items={byState("flat")}
          loading={attention.loading}
          error={attention.error}
          retry={attention.retry}
        />
      </div>

      <p className="text-[11px] text-faint">
        Method: attention velocity compares each token&apos;s volume / transaction / buyer
        rates against its own age-adjusted baseline. Labels are calculated, not judged.
      </p>

    </div>
  );
}
