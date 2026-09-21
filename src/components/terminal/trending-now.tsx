"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { AttentionClassification, DnaProfile } from "@/lib/types";
import { TokenLogo } from "@/components/ui/kit";
import { fmtAge, fmtPct, fmtUsd, cn } from "@/lib/utils";

/**
 * TRENDING NOW — a premium ranked list.
 * 01  [logo] $TICKER   NARRATIVE   +184%   $284K   DNA 82
 * Hover: soft background, attention glow, and an expanded secondary preview
 * (volume · liquidity · holders · age — the secondary data tier).
 */

function DnaCell({ address }: { address: string }) {
  const { data } = useApi<DnaProfile>(`/api/dna/${address}`);
  if (!data) return <span className="font-mono text-[11px] text-faint">DNA ···</span>;
  const composite = Math.round(
    data.dimensions.reduce((a, d) => a + d.score, 0) / data.dimensions.length
  );
  return (
    <span className="font-mono text-[11px] tabular-nums">
      <span className="text-faint">DNA</span>{" "}
      <span className={cn("font-bold", composite >= 60 ? "text-up" : composite >= 30 ? "text-signal" : "text-warn")}>
        {composite}
      </span>
    </span>
  );
}

export function TrendingNow({
  items,
  onSelect,
}: {
  items: AttentionClassification[];
  onSelect: (address: string) => void;
}) {
  const ranked = [...items]
    .sort((a, b) => (b.token.attentionVelocity ?? 0) - (a.token.attentionVelocity ?? 0))
    .slice(0, 6);

  return (
    <div>
      {/* header row */}
      <div className="hidden grid-cols-[28px_2fr_1.2fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-edge px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint sm:grid">
        <span>#</span>
        <span>Token</span>
        <span>Narrative</span>
        <span className="text-right">Attention</span>
        <span className="text-right">Market</span>
        <span className="text-right">DNA</span>
      </div>
      {ranked.map((i, idx) => {
        const t = i.token;
        return (
          <div
            key={t.address}
            onClick={() => onSelect(t.address)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(t.address)}
            className="row-sep group cursor-pointer px-3 py-3 transition-colors hover:bg-surface2/50"
          >
            <div className="grid grid-cols-[28px_2fr_1.2fr_0.8fr_0.8fr_0.7fr] items-center gap-3">
              <span className="font-mono text-[12px] tabular-nums text-faint">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 items-center gap-2.5">
                <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={26} />
                <span
                  className={cn(
                    "truncate font-mono font-bold tracking-tight",
                    idx === 0 ? "text-[15px] text-signal" : "text-[13px] text-ink"
                  )}
                >
                  {t.ticker}
                </span>
              </div>
              <span className="truncate text-[12px] capitalize text-muted">
                {t.narrativeTag.replace("-", " ")}
              </span>
              <div className="text-right">
                <span
                  className={cn(
                    "font-mono text-[13px] font-bold tabular-nums",
                    t.priceChange24hPct >= 0 ? "text-up" : "text-down"
                  )}
                >
                  {fmtPct(t.priceChange24hPct, 1)}
                </span>
                <div className="mt-0.5 ml-auto h-[2px] w-3/4 rounded bg-accent/50 transition-colors group-hover:bg-signal" />
              </div>
              <span className="text-right font-mono text-[12px] tabular-nums text-muted">
                {fmtUsd(t.marketCapUsd)}
              </span>
              <div className="text-right">
                <DnaCell address={t.address} />
              </div>
            </div>
            {/* expanded secondary preview on hover */}
            <div className="grid max-h-0 overflow-hidden px-9 font-mono text-[10px] text-faint transition-all duration-200 group-hover:max-h-8 group-hover:pt-1.5 sm:grid-cols-4">
              <span>vol {fmtUsd(t.volume24hUsd)}</span>
              <span>liq {fmtUsd(t.liquidityUsd)}</span>
              <span>holders {t.holders ?? "—"}</span>
              <span>age {fmtAge(t.ageMinutes)}</span>
            </div>
          </div>
        );
      })}
      {ranked.length === 0 && (
        <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          no signals yet — MEMEOS is listening…
        </p>
      )}
    </div>
  );
}
