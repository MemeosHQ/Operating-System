"use client";

import type { TokenMetrics } from "@/lib/types";
import { Panel, PanelHeader, Badge } from "@/components/ui/kit";
import { EmptyState } from "@/components/ui/states";
import { buildActivityFeed } from "@/lib/series";
import { fmtUsd } from "@/lib/utils";

/** Secondary token-detail tabs (part 1): Wallets, Activity, Holders. */

export function WalletsTab({ token }: { token: TokenMetrics }) {
  return (
    <Panel>
      <PanelHeader
        title="Notable wallet activity"
        right={token.notableWallets ? <Badge tone="accent">{token.notableWallets} notable</Badge> : null}
      />
      {token.notableWallets ? (
        <div className="space-y-2 p-4 text-[13px] text-muted">
          <p>
            <b className="text-ink">{token.notableWallets}</b> notable wallet(s) transacted
            this token in the current window. Individual addresses require indexed
            transaction data.
          </p>
          <p className="text-[11px] text-faint">
            Enable HELIUS_API_KEY to resolve addresses, funding links and the wallet graph.
          </p>
        </div>
      ) : (
        <EmptyState
          title="No notable-wallet activity observed"
          hint="Notable wallets are wallets with tracked high-conviction histories. Absence of signal is not absence of smart money."
        />
      )}
    </Panel>
  );
}

export function ActivityTab({ token }: { token: TokenMetrics }) {
  const events = buildActivityFeed(token);
  return (
    <Panel>
      <PanelHeader title="Activity" sub="Observed counters and launch events" />
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Cell label="Volume 24h" value={fmtUsd(token.volume24hUsd)} />
        <Cell label="Transactions 24h" value={token.txns24h ?? "—"} />
        <Cell label="Buys 24h" value={token.buys24h ?? "—"} tone="up" />
        <Cell label="Sells 24h" value={token.sells24h ?? "—"} tone="down" />
      </div>
      <div className="border-t border-edge">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-edge/60 px-4 py-2 last:border-0">
            <span className="w-12 font-mono text-[11px] tabular-nums text-faint">{e.clock}</span>
            <span className="text-[13px] text-ink">{e.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function HoldersTab({ token }: { token: TokenMetrics }) {
  if (token.holders === undefined) {
    return (
      <Panel>
        <PanelHeader title="Holders" />
        <EmptyState
          title="Holder analytics temporarily unavailable"
          hint="Live holder counts and concentration require BIRDEYE_API_KEY (or HELIUS_API_KEY) on the server."
        />
      </Panel>
    );
  }
  return (
    <Panel>
      <PanelHeader title="Holders" right={<Badge tone="neutral">{token.holders}</Badge>} />
      <p className="p-4 text-[12px] text-faint">
        Holder concentration and top-holder analysis require indexed holder data
        (BIRDEYE_API_KEY). The count above is observed.
      </p>
    </Panel>
  );
}

function Cell({ label, value, tone }: { label: string; value: string | number; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-[14px] font-semibold tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
