"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type { AttentionPayload } from "@/lib/types";
import { Panel, PanelHeader, Badge, AddrLink } from "@/components/ui/kit";
import { StateGate } from "@/components/ui/states";
import { TokenRow } from "@/components/tokens";
import { shortAddr } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** LIVE FEED — newly active Solana meme tokens. */
type SortKey = "newest" | "attention" | "volume" | "mcap";

export default function LivePage() {
  const { data, loading, error, requiredEnv, retry } = useApi<AttentionPayload>(
    "/api/attention",
    { refreshMs: 20_000 }
  );
  const [sort, setSort] = useState<SortKey>("attention");

  const items = useMemo(() => {
    const arr = [...(data?.tokens ?? [])];
    switch (sort) {
      case "newest":
        return arr.sort((a, b) => a.token.ageMinutes - b.token.ageMinutes);
      case "volume":
        return arr.sort((a, b) => b.token.volume24hUsd - a.token.volume24hUsd);
      case "mcap":
        return arr.sort((a, b) => b.token.marketCapUsd - a.token.marketCapUsd);
      default:
        return arr.sort((a, b) => b.velocityMultiplier - a.velocityMultiplier);
    }
  }, [data, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Live Feed</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Newly active Solana meme tokens — refreshes every 20s.
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["attention", "newest", "volume", "mcap"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                sort === k
                  ? "border-accent/60 bg-accent/10 text-accent-soft"
                  : "border-edge2 text-muted hover:text-ink"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <StateGate
        loading={loading}
        error={error}
        requiredEnv={requiredEnv}
        onRetry={retry}
        isEmpty={items.length === 0}
        empty={{ title: "No active tokens right now", hint: "The feed will populate as soon as market data flows." }}
      >
        <Panel>
          <PanelHeader
            title={`${items.length} tokens`}
            sub="name · narrative · age · holders · market · volume · attention"
            right={<AddrLink address="" className="hidden" />}
          />
          <div>
            {items.map((i, idx) => (
              <TokenRow key={i.address} token={i.token} attention={i} rank={idx + 1} />
            ))}
          </div>
        </Panel>
      </StateGate>

      <p className="flex items-center gap-2 text-[11px] text-faint">
        <Badge tone="up">smart money</Badge>
        appears when {items.filter((i) => (i.token.notableWallets ?? 0) > 0).length} tokens show notable-wallet activity
        — addresses like {items[0] ? shortAddr(items[0].token.address) : "—"} are observable, not verdicts.
      </p>
    </div>
  );
}
