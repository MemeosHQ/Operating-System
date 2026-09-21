"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { CreatorProfile } from "@/lib/types";
import { Panel } from "@/components/ui/kit";
import { StateGate } from "@/components/ui/states";
import { fmtNum, shortAddr } from "@/lib/utils";

export default function CreatorsPage() {
  const { data, loading, error, requiredEnv, retry } = useApi<CreatorProfile[]>("/api/creators");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Creator Intelligence</h1>
        <p className="mt-1 text-[14px] text-muted">
          Observable launch history — no fraud verdicts, just the record.
        </p>
      </div>

      <StateGate
        loading={loading}
        error={error}
        requiredEnv={requiredEnv}
        onRetry={retry}
        isEmpty={(data ?? []).length === 0}
        empty={{ title: "No creators in the current window", hint: "Creator profiles build up as launches occur." }}
      >
        <Panel>
          <div className="divide-y divide-edge/60">
            {(data ?? []).map((c) => (
              <a
                key={c.address}
                href={`/creator/${c.address}`}
                className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-surface2/70"
              >
                <span className="font-mono text-[12px] text-ink">{shortAddr(c.address, 6)}</span>
                <span className="font-mono text-[11px] text-faint">
                  {c.launchCount} launch{c.launchCount === 1 ? "" : "es"}
                </span>
                <span className="font-mono text-[11px] text-faint">
                  {c.successfulLaunches} successful
                </span>
                <span className="font-mono text-[11px] text-faint">
                  avg peak {fmtNum(c.avgPeakMarketCapUsd)}
                </span>
                <span className="ml-auto capitalize text-[11px] text-muted">
                  {c.recurringNarratives.join(" · ")}
                </span>
              </a>
            ))}
          </div>
        </Panel>
      </StateGate>

      <p className="text-[11px] text-faint">
        &quot;Successful&quot; = graduated or sustained &gt;$500K market cap. Terminology is
        deliberately careful: the record is observable, motives are not.
      </p>
    </div>
  );
}
