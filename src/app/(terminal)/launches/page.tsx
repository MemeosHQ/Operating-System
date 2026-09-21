"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type { Launch } from "@/lib/types";
import { Panel, PanelHeader, Badge, TokenLogo } from "@/components/ui/kit";
import { StateGate, EmptyState } from "@/components/ui/states";
import { LaunchReplay } from "@/components/launch-replay";
import { fmtAge, fmtUsd, cn } from "@/lib/utils";

/** LAUNCH REPLAY — the first 60 seconds, as a scrubbable timeline. */
export default function LaunchesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const launches = useApi<Launch[]>("/api/launches", { refreshMs: 30_000 });
  const replay = useApi<Launch>(selected ? `/api/launches/${selected}` : "/api/launches?q=none");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Launch Replay</h1>
        <p className="mt-1 text-[14px] text-muted">
          The first 60 seconds of a launch — buyers, whales, acceleration — as a scrubbable timeline.
        </p>
      </div>

      <StateGate
        loading={launches.loading}
        error={launches.error}
        requiredEnv={launches.requiredEnv}
        onRetry={launches.retry}
        isEmpty={(launches.data ?? []).length === 0}
        empty={{ title: "No launches in the current window" }}
      >
        <Panel>
          <PanelHeader title="Live launch feed" sub="Newest first — select to replay" />
          <div>
            {(launches.data ?? []).map((l) => (
              <button
                key={l.address}
                onClick={() => setSelected(l.address)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-edge/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-surface2/70",
                  selected === l.address && "bg-accent/5"
                )}
              >
                <TokenLogo ticker={l.ticker} size={26} />
                <span className="font-mono text-[13px] font-semibold text-ink">{l.ticker}</span>
                <span className="hidden text-[12px] text-muted sm:inline">{l.name}</span>
                <Badge tone={l.status === "graduated" ? "up" : "neutral"}>{l.status}</Badge>
                <span className="ml-auto text-right">
                  <span className="block font-mono text-[12px] tabular-nums text-ink">{fmtUsd(l.marketCapUsd)}</span>
                  <span className="block text-[11px] text-faint">{fmtAge((Date.now() - l.createdAtMs) / 60_000)} old</span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </StateGate>

      {selected && (
        <StateGate loading={replay.loading} error={replay.error} requiredEnv={replay.requiredEnv} onRetry={replay.retry}>
          {replay.data && replay.data.events && replay.data.events.length > 0 ? (
            <LaunchReplay launch={replay.data} />
          ) : replay.data ? (
            <EmptyState
              title="No event data for this launch"
              hint="First-60-second streams require indexed launch data (Helius webhooks). Select a launch with replay support."
            />
          ) : null}
        </StateGate>
      )}

      {!selected && (launches.data ?? []).length > 0 && (
        <Panel className="p-4 text-center">
          <p className="text-[13px] text-muted">Select a launch above to replay its first minute.</p>
        </Panel>
      )}

      <Link href="/live" className="text-[12px] text-accent-soft hover:underline">
        ← Back to live feed
      </Link>
    </div>
  );
}
