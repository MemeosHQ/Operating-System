"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { CreatorProfile } from "@/lib/types";
import { Panel, PanelHeader, Badge } from "@/components/ui/kit";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { TokenRow } from "@/components/tokens";
import { fmtNum, relTime } from "@/lib/utils";
import { useApp } from "@/lib/providers/app-provider";

export function CreatorDetail({ address }: { address: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<CreatorProfile>(
    `/api/creators/${address}`
  );
  const { isWatched, toggleWatch } = useApp();

  if (loading) return <LoadingState rows={4} label="Loading creator history…" />;
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={retry} />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-[15px] font-semibold break-all text-ink">{address}</h1>
          <p className="mt-1 text-[13px] text-muted">
            Creator profile — observed launch record only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/wallet/${address}`} className="text-[12px] text-accent-soft hover:underline">
            View as wallet →
          </Link>
          <button
            onClick={() => toggleWatch({ kind: "creator", id: address, label: `creator ${address.slice(0, 6)}` })}
            className="rounded-md border border-edge2 bg-surface2 px-3 py-1.5 text-[12px] text-ink hover:border-accent hover:text-accent-soft"
          >
            {isWatched("creator", address) ? "★ Watching" : "☆ Watch creator"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Launches" value={data.launchCount} />
        <Stat label="Successful" value={data.successfulLaunches} />
        <Stat label="Avg peak MC" value={`$${fmtNum(data.avgPeakMarketCapUsd)}`} />
        <Stat label="Median lifespan" value={`${Math.round(data.medianLifespanMinutes / 60)}h`} />
        <Stat label="Per week" value={data.launchFrequencyPerWeek || "—"} />
      </div>

      <Panel>
        <PanelHeader
          title="Recurring narratives"
          right={
            <div className="flex gap-1.5">
              {data.recurringNarratives.map((n) => (
                <Badge key={n} tone="accent">
                  {n.replace("-", " ")}
                </Badge>
              ))}
            </div>
          }
        />
        {data.firstLaunchMs && (
          <p className="px-4 py-2 text-[11px] text-faint">
            First observed launch: {relTime(data.firstLaunchMs)}
          </p>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Historical tokens" sub={`${data.tokens.length} launches`} />
        <div>
          {data.tokens.map((t) => (
            <TokenRow key={t.address} token={t} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint">{label}</div>
      <div className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
