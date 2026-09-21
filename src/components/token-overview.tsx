"use client";

import type { TokenMetrics } from "@/lib/types";
import { Panel, PanelHeader, Badge, Metric } from "@/components/ui/kit";
import { PriceChart } from "@/components/charts";
import { buildPriceSeries, buildHolderSeries } from "@/lib/series";
import { fmtNum, fmtPct, fmtUsd } from "@/lib/utils";

/** Token Overview tab: price, counters, attention changes. */
export function TokenOverview({ t }: { t: TokenMetrics }) {
  const price = buildPriceSeries(t);
  const holders = buildHolderSeries(t);
  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Price"
          sub="Reconstructed from the current snapshot — historical series require an indexer"
          right={<Badge tone={t.priceChange24hPct >= 0 ? "up" : "down"}>{fmtPct(t.priceChange24hPct, 1)}</Badge>}
        />
        <div className="p-2">
          <PriceChart data={price} height={240} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Volume / liquidity / holders" sub="Observed counters" />
          <div className="grid grid-cols-3 gap-3 p-4">
            <Metric label="Volume 24h" value={fmtUsd(t.volume24hUsd)} />
            <Metric label="Liquidity" value={fmtUsd(t.liquidityUsd)} />
            <Metric label="Holders" value={t.holders !== undefined ? fmtNum(t.holders) : "—"} />
          </div>
          <div className="border-t border-edge p-4">
            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-faint">
              Holder growth (reconstructed)
            </div>
            <div className="flex h-12 items-end gap-0.5">
              {holders.map((d, i) => {
                const max = Math.max(...holders.map((x) => x.attention), 1);
                return (
                  <div
                    key={i}
                    title={`${d.label}: ${d.attention}`}
                    className="flex-1 rounded-sm bg-live/60"
                    style={{ height: `${(d.attention / max) * 100}%` }}
                  />
                );
              })}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Attention changes" sub="Observed vs. calculated" />
          <div className="space-y-2 p-4 text-[13px] text-muted">
            <p>OBSERVED: volume {fmtUsd(t.volume24hUsd)} · price {fmtPct(t.priceChange24hPct, 1)}</p>
            <p>CALCULATED: attention velocity {t.attentionVelocity ?? "—"}/100</p>
            <p>
              {(t.notableWallets ?? 0) > 0
                ? `OBSERVED: ${t.notableWallets} notable wallet(s) transacted`
                : "No notable-wallet activity observed"}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
