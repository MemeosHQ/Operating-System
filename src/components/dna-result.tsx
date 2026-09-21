"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { DnaProfile } from "@/lib/types";
import { Panel, PanelHeader, Badge, TokenLogo } from "@/components/ui/kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { DnaRadar } from "@/components/charts";
import { fmtAge, fmtUsd, cn } from "@/lib/utils";

/** Meme DNA result view — used by /dna and the token detail DNA tab. */
export function DnaResult({ address }: { address: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<DnaProfile>(`/api/dna/${address}`);
  if (loading) return <LoadingState rows={4} label="Sequencing Meme DNA…" />;
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  if (!data) return <EmptyState title="No DNA data for this address" />;
  const t = data.token;
  const radar = data.dimensions.map((d) => ({ dimension: d.label.split(" ")[0], score: d.score }));
  const composite = Math.round(
    data.dimensions.reduce((a, d) => a + d.score, 0) / data.dimensions.length
  );

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={40} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-bold text-ink">{t.ticker}</span>
              <span className="text-[13px] text-muted">{t.name}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-faint">
              {fmtAge(t.ageMinutes)} old · {fmtUsd(t.marketCapUsd)} MC · {fmtUsd(t.liquidityUsd)} liquidity
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-[0.14em] text-faint">DNA composite</div>
            <div className="font-mono text-xl font-bold text-accent-soft">{composite}/100</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader title="Genome" sub="8 dimensions, 0–100 — every score shows its basis" />
          <div className="space-y-3 p-4">
            {data.dimensions.map((d) => (
              <div key={d.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-ink">{d.label}</span>
                  <span className="font-mono text-[12px] tabular-nums text-muted">{d.score}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-edge">
                  <div
                    className={cn("h-full rounded", d.score >= 60 ? "bg-up" : d.score >= 30 ? "bg-accent" : "bg-warn")}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] leading-snug text-faint">{d.basis}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-2">
            <DnaRadar data={radar} />
          </Panel>
          <Panel>
            <PanelHeader title="Evidence" sub="Observed vs. calculated" />
            <div className="space-y-2 p-4">
              {data.evidence.slice(0, 5).map((e, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <Badge tone={e.kind === "observed" ? "up" : "accent"}>{e.kind}</Badge>
                  <span className="text-muted">{e.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {data.evolution.length > 0 && (
        <Panel>
          <PanelHeader title="DNA Evolution" sub="How the profile changed over the first hour" />
          <div className="grid gap-px bg-edge sm:grid-cols-4">
            {data.evolution.map((p) => (
              <div key={p.label} className="bg-surface p-3">
                <div className="font-mono text-[11px] text-faint">{p.label}</div>
                <div className="mt-2 flex h-14 items-end gap-1">
                  {Object.entries(p.scores).map(([k, v]) => (
                    <div
                      key={k}
                      title={`${k}: ${v}`}
                      className="flex-1 rounded-sm bg-accent/60"
                      style={{ height: `${Math.max(6, v)}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.availability.unavailable.length > 0 && (
        <div className="space-y-1 rounded-lg border border-warn/30 bg-warn/5 p-3">
          {data.availability.unavailable.map((u, i) => (
            <p key={i} className="text-[11px] text-warn/90">
              {u.capability}: {u.reason}
              {u.requiredEnv ? ` (env: ${u.requiredEnv.join(", ")})` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
