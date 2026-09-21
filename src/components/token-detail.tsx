"use client";

import { useState } from "react";
import type { TokenMetrics } from "@/lib/types";
import { Panel, Badge, TokenLogo, Metric } from "@/components/ui/kit";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useApi } from "@/lib/hooks/use-api";
import { AttentionSpark } from "@/components/charts";
import { DnaResult } from "@/components/dna-result";
import { TokenOverview } from "@/components/token-overview";
import { WalletsTab, ActivityTab, HoldersTab } from "@/components/token-tabs";
import { AiTab, LaunchTab } from "@/components/token-tabs-2";
import { fmtAge, fmtNum, fmtPct, fmtUsd, cn, shortAddr } from "@/lib/utils";
import { lifecycleStage, LIFECYCLE_LABELS } from "@/lib/metrics/lifecycle";
import { useApp } from "@/lib/providers/app-provider";

const TABS = ["Overview", "DNA", "Wallets", "Activity", "Holders", "Launch", "AI"] as const;
type Tab = (typeof TABS)[number];

export function TokenDetail({ address }: { address: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<TokenMetrics>(`/api/tokens/${address}`);
  const [tab, setTab] = useState<Tab>("Overview");
  const { isWatched, toggleWatch } = useApp();

  if (loading) return <LoadingState rows={6} label="Loading token…" />;
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  if (!data) return <ErrorState message="Token not found." onRetry={retry} />;

  const t = data;
  const stage = LIFECYCLE_LABELS[lifecycleStage(t)];
  const up = t.priceChange24hPct >= 0;

  return (
    <div className="space-y-5">
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={44} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-ink">{t.ticker}</h1>
              <span className="text-[13px] text-muted">{t.name}</span>
              <Badge tone="neutral">{stage}</Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
              <span className="font-mono">{shortAddr(t.address, 6)}</span>
              {t.creatorAddress && <span>· creator {shortAddr(t.creatorAddress, 4)}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-xl font-bold tabular-nums text-ink">{fmtUsd(t.marketCapUsd)}</div>
            <div className={cn("font-mono text-[12px] tabular-nums", up ? "text-up" : "text-down")}>
              {fmtPct(t.priceChange24hPct, 1)} · 24h
            </div>
          </div>
          <button
            onClick={() => toggleWatch({ kind: "token", id: t.address, label: t.ticker })}
            className={cn(
              "rounded-md border px-3 py-1.5 text-[12px] transition-colors",
              isWatched("token", t.address)
                ? "border-accent/60 bg-accent/10 text-accent-soft"
                : "border-edge2 bg-surface2 text-ink hover:border-accent hover:text-accent-soft"
            )}
          >
            {isWatched("token", t.address) ? "★ Watching" : "☆ Watch"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-edge pt-3 sm:grid-cols-5">
          <Metric label="Liquidity" value={fmtUsd(t.liquidityUsd)} />
          <Metric label="Volume 24h" value={fmtUsd(t.volume24hUsd)} />
          <Metric label="Age" value={fmtAge(t.ageMinutes)} />
          <Metric label="Holders" value={t.holders !== undefined ? fmtNum(t.holders) : "—"} />
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-faint">Attention</div>
            <div className="mt-1.5">
              <AttentionSpark value={t.attentionVelocity ?? 0} state="accelerating" />
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex gap-1 overflow-x-auto border-b border-edge pb-px">
        {TABS.map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={cn(
              "whitespace-nowrap rounded-t-md px-3.5 py-2 text-[13px] transition-colors",
              tab === x
                ? "border border-b-0 border-edge bg-surface font-semibold text-ink"
                : "text-muted hover:text-ink"
            )}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="rise-in">
        {tab === "Overview" && <TokenOverview t={t} />}
        {tab === "DNA" && <DnaResult address={address} />}
        {tab === "Wallets" && <WalletsTab token={t} />}
        {tab === "Activity" && <ActivityTab token={t} />}
        {tab === "Holders" && <HoldersTab token={t} />}
        {tab === "Launch" && <LaunchTab address={address} />}
        {tab === "AI" && <AiTab address={address} />}
      </div>
    </div>
  );
}
