"use client";

import { useApi } from "@/lib/hooks/use-api";
import type { AttentionClassification, DnaProfile, TokenMetrics } from "@/lib/types";
import { fmtAge, fmtPct, fmtUsd, cn } from "@/lib/utils";
import { TokenLogo, Badge } from "@/components/ui/kit";
import { useApp } from "@/lib/providers/app-provider";

/**
 * Token intelligence drawer — slides over the right edge of the universe
 * instead of navigating away. Calm, editorial, data-labeled.
 */
export function TokenPanel({
  address,
  onClose,
  attention,
}: {
  address: string;
  onClose: () => void;
  attention?: AttentionClassification;
}) {
  const { data, loading, error, requiredEnv, retry } = useApi<TokenMetrics>(`/api/tokens/${address}`);
  const { data: dna, loading: dnaLoading } = useApi<DnaProfile>(`/api/dna/${address}`);
  const { isWatched, toggleWatch } = useApp();
  const t = data;
  const dnaTop = [...(dna?.dimensions ?? [])].sort((a, b) => b.score - a.score).slice(0, 4);

  const signals: { icon: string; text: string; tone: string }[] = [];
  if (t) {
    if ((t.notableWallets ?? 0) > 0) signals.push({ icon: "🐋", text: "notable wallet entered", tone: "text-up" });
    if (attention && (attention.state === "exploding" || attention.state === "accelerating"))
      signals.push({ icon: "🔥", text: `attention ${attention.state}`, tone: "text-accent-soft" });
    if (t.holders !== undefined) signals.push({ icon: "👥", text: `${t.holders} holders observed`, tone: "text-muted" });
    if ((t.attentionVelocity ?? 0) >= 60) signals.push({ icon: "🧬", text: "DNA re-sequenced", tone: "text-signal" });
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-full max-w-sm drawer-panel">
      <div className="flex h-full flex-col overflow-hidden rounded-l-2xl border border-edge2 bg-surface/95 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3 border-b border-edge p-5">
          {t ? (
            <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={40} />
          ) : (
            <div className="h-10 w-10 animate-pulse rounded-md bg-surface2" />
          )}
          <div className="min-w-0 flex-1">
            {t ? (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-[16px] font-bold text-ink">{t.ticker}</h2>
                  {attention && (
                    <Badge
                      tone={
                        attention.state === "exploding"
                          ? "up"
                          : attention.state === "cooling"
                            ? "warn"
                            : "accent"
                      }
                    >
                      {attention.state}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[12px] text-muted">{t.name}</p>
              </>
            ) : (
              <div className="h-9 w-28 animate-pulse rounded bg-surface2" />
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close intelligence panel"
            className="rounded-md p-1 text-faint transition-colors hover:bg-surface2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-surface2" />
              ))}
            </div>
          )}
          {error && (
            <div className="text-[13px] text-down">
              {error}
              {requiredEnv && requiredEnv.length > 0 && (
                <span className="mt-1 block font-mono text-[10px] text-warn">
                  requires: {requiredEnv.join(", ")}
                </span>
              )}
              <button
                onClick={retry}
                className="mt-3 rounded-md border border-edge2 px-3 py-1.5 text-[12px] text-ink hover:border-accent"
              >
                Retry
              </button>
            </div>
          )}
          {t && !loading && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Fact label="Market cap" value={fmtUsd(t.marketCapUsd)} big />
                <Fact
                  label="Price 24h"
                  value={fmtPct(t.priceChange24hPct, 1)}
                  big
                  tone={t.priceChange24hPct >= 0 ? "up" : "down"}
                />
                <Fact label="Liquidity" value={fmtUsd(t.liquidityUsd)} />
                <Fact label="Volume 24h" value={fmtUsd(t.volume24hUsd)} />
                <Fact label="Age" value={fmtAge(t.ageMinutes)} />
                <Fact label="Holders" value={t.holders !== undefined ? String(t.holders) : "—"} />
              </div>

              {/* MEME DNA */}
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  Meme DNA
                </div>
                {dnaLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="shimmer h-3 rounded-full" />
                    ))}
                  </div>
                ) : dnaTop.length > 0 ? (
                  <div className="space-y-2">
                    {dnaTop.map((d) => (
                      <div key={d.key}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-muted">{d.label}</span>
                          <span className="font-mono text-[11px] tabular-nums text-ink">{d.score}</span>
                        </div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-edge">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              d.score >= 60 ? "bg-up/80" : d.score >= 30 ? "bg-signal/80" : "bg-warn/80"
                            )}
                            style={{ width: `${d.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-faint">DNA unavailable for this token.</p>
                )}
              </div>

              {/* LIVE SIGNALS */}
              {signals.length > 0 && (
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                    Live signals
                  </div>
                  <div className="space-y-1">
                    {signals.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span>{s.icon}</span>
                        <span className={s.tone}>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attention && (
                <div className="rounded-lg border border-edge bg-surface2/50 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-faint">Attention</div>
                  <div className="mt-1.5 font-mono text-[14px] font-semibold text-accent-soft">
                    {attention.velocityMultiplier.toFixed(1)}× baseline · {t.attentionVelocity ?? "—"}/100
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted">{attention.reason}</p>
                </div>
              )}

              <div className="space-y-2 text-[12px] leading-relaxed text-muted">
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">OBSERVED · </span>
                  {(t.notableWallets ?? 0) > 0
                    ? `${t.notableWallets} notable wallet(s) transacted`
                    : "no notable-wallet activity recorded"}
                </p>
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">CALCULATED · </span>
                  attention velocity {t.attentionVelocity ?? "—"}/100 vs. the token&apos;s own baseline
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`/token/${t.address}`}
                  className="flex-1 rounded-md bg-accent px-4 py-2 text-center text-[12px] font-semibold text-white transition-colors hover:bg-accent-soft"
                >
                  Full intelligence
                </a>
                <button
                  onClick={() => toggleWatch({ kind: "token", id: t.address, label: t.ticker })}
                  className={cn(
                    "rounded-md border px-3 py-2 text-[12px] transition-colors",
                    isWatched("token", t.address)
                      ? "border-accent/50 bg-accent/10 text-accent-soft"
                      : "border-edge2 text-muted hover:border-accent hover:text-ink"
                  )}
                >
                  {isWatched("token", t.address) ? "★" : "☆"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  big,
  tone,
}: {
  label: string;
  value: string;
  big?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-faint">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono tabular-nums",
          big ? "text-[18px] font-bold" : "text-[13px] font-semibold",
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}
