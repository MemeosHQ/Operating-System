"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { WalletProfile } from "@/lib/types";
import { Panel, PanelHeader, Badge, AddrLink, Metric } from "@/components/ui/kit";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { fmtNum, fmtUsd, relTime } from "@/lib/utils";

/** Wallet profile view — shared by /wallets search and /wallet/[address]. */
export function WalletIntel({ address }: { address: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<WalletProfile>(
    `/api/wallets/${address}`
  );

  if (loading) return <LoadingState rows={4} label="Profiling wallet…" />;
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-[14px] font-semibold text-ink">{address}</h2>
          <AddrLink address={address} />
          <a
            href={data.solanaFmUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[12px] text-accent-soft hover:underline"
          >
            View on Solscan ↗
          </a>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.labels.map((l) => (
            <Badge key={l} tone={l === "UNKNOWN" ? "neutral" : "accent"}>
              {l}
            </Badge>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="SOL balance" value={data.solBalance !== undefined ? fmtNum(data.solBalance) : "—"} />
          <Metric label="Tokens held" value={data.tokenCount ?? "—"} />
          <Metric label="Launch participation" value={data.launchParticipation} />
          <Metric label="Early entries" value={data.earlyEntries} />
        </div>
        {data.walletAgeDays !== undefined && (
          <p className="mt-3 text-[11px] text-faint">Wallet age: ~{data.walletAgeDays} days (observed)</p>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Recent trades" sub="Most recent activity (observable)" />
        {data.recentTrades.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted">
            No recent trades available — trade history requires Helius Enhanced Transactions.
          </p>
        ) : (
          <div>
            {data.recentTrades.map((t, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-edge/60 px-4 py-2 last:border-0">
                <Badge tone={t.side === "buy" ? "up" : "down"}>{t.side}</Badge>
                <span className="font-mono text-[13px] font-semibold text-ink">{t.tokenTicker}</span>
                <span className="ml-auto font-mono text-[12px] tabular-nums text-muted">{fmtUsd(t.amountUsd)}</span>
                <span className="w-16 text-right text-[11px] text-faint">{relTime(t.atMs)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Notable interactions" sub="Tokens this wallet has recently touched" />
        <div className="flex flex-wrap gap-1.5 p-4">
          {data.notableInteractions.length === 0 ? (
            <p className="text-[12px] text-faint">No notable interactions observed.</p>
          ) : (
            data.notableInteractions.map((n) => (
              <Badge key={n} tone="neutral">
                {n}
              </Badge>
            ))
          )}
        </div>
      </Panel>

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
