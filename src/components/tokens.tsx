"use client";

import Link from "next/link";
import { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { AttentionClassification, TokenMetrics } from "@/lib/types";
import { fmtAge, fmtPct, fmtUsd, cn } from "@/lib/utils";
import { Badge, TokenLogo } from "@/components/ui/kit";
import { AttentionSpark } from "@/components/charts";

const STATE_TONE: Record<string, "up" | "accent" | "warn" | "neutral"> = {
  exploding: "up",
  accelerating: "accent",
  cooling: "warn",
  flat: "neutral",
};

export const TokenRow = memo(function TokenRow({
  token,
  attention,
  rank,
}: {
  token: TokenMetrics;
  attention?: { state: string; reason: string };
  rank?: number;
}) {
  return (
    <Link
      href={`/token/${token.address}`}
      className="group flex items-center gap-3 border-b border-edge/60 px-3 py-2.5 transition-colors last:border-0 hover:bg-surface2/70"
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 font-mono text-[11px] text-faint">{rank}</span>
      )}
      <TokenLogo ticker={token.ticker} url={token.logoUrl} urls={token.logoUrls} size={30} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-[13px] font-semibold text-ink">
            {token.ticker}
          </span>
          <span className="truncate text-[12px] text-muted">{token.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-faint">
          <span className="capitalize">{token.narrativeTag.replace("-", " / ")}</span>
          <span>{fmtAge(token.ageMinutes)} old</span>
          {token.holders !== undefined && <span>{token.holders} holders</span>}
          {(token.notableWallets ?? 0) > 0 && (
            <span className="text-accent-soft">{token.notableWallets} notable wallets</span>
          )}
        </div>
      </div>
      {attention && (
        <div className="hidden w-16 shrink-0 sm:block">
          <AttentionSpark value={token.attentionVelocity ?? 0} state={attention.state} />
        </div>
      )}
      <div className="w-20 shrink-0 text-right">
        <div className="font-mono text-[13px] font-semibold tabular-nums text-ink">
          {fmtUsd(token.marketCapUsd)}
        </div>
        <div
          className={cn(
            "font-mono text-[11px] tabular-nums",
            token.priceChange24hPct >= 0 ? "text-up" : "text-down"
          )}
        >
          {fmtPct(token.priceChange24hPct, 1)}
        </div>
      </div>
      <div className="hidden w-24 shrink-0 text-right md:block">
        <div className="font-mono text-[12px] tabular-nums text-muted">
          {fmtUsd(token.volume24hUsd)}
        </div>
        <div className="text-[11px] text-faint">vol 24h</div>
      </div>
      {attention ? (
        <Badge tone={STATE_TONE[attention.state]} className="hidden lg:inline-flex">
          {attention.state}
        </Badge>
      ) : (
        <Badge tone="neutral" className="hidden lg:inline-flex">
          {token.status}
        </Badge>
      )}
      <ArrowUpRight
        size={14}
        className="shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
});

export function TokenGrid({ tokens }: { tokens: TokenMetrics[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {tokens.map((t) => (
        <Link
          key={t.address}
          href={`/token/${t.address}`}
          className="group rounded-lg border border-edge bg-surface p-3 transition-colors hover:border-edge2 hover:bg-surface2/60"
        >
          <div className="flex items-center gap-2.5">
            <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={26} />
            <span className="font-mono text-[13px] font-semibold text-ink">{t.ticker}</span>
            <span className="ml-auto font-mono text-[12px] tabular-nums text-ink">
              {fmtUsd(t.marketCapUsd)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
            <span className="capitalize">{t.narrativeTag.replace("-", " / ")}</span>
            <span>{fmtAge(t.ageMinutes)} old</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <AttentionSpark value={t.attentionVelocity ?? 0} state="flat" compact />
            <span
              className={cn(
                "font-mono text-[12px] tabular-nums",
                t.priceChange24hPct >= 0 ? "text-up" : "text-down"
              )}
            >
              {fmtPct(t.priceChange24hPct, 1)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AttentionSummary({ items }: { items: AttentionClassification[] }) {
  const counts = { exploding: 0, accelerating: 0, cooling: 0, flat: 0 } as Record<string, number>;
  for (const i of items) counts[i.state]++;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(["exploding", "accelerating", "cooling", "flat"] as const).map((s) => (
        <div key={s} className="rounded-lg border border-edge bg-surface px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">{s}</div>
          <div className="mt-1 font-mono text-lg font-semibold text-ink">{counts[s]}</div>
        </div>
      ))}
    </div>
  );
}
