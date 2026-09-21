"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { Narrative } from "@/lib/types";
import { useApp } from "@/lib/providers/app-provider";
import { cn, fmtPct } from "@/lib/utils";
import { Badge } from "@/components/ui/kit";
import { Reveal } from "./reveal";
import { usdCompact } from "./hero-console";

/** ATTENTION + NARRATIVES landing sections (real provider data, editorial hierarchy). */

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">{eyebrow}</div>
      <h2 className="mt-2.5 text-[26px] font-bold leading-tight tracking-tight text-ink md:text-[34px]">
        {title}
      </h2>
    </div>
  );
}

/** ATTENTION — momentum streams, strongest narrative visually dominant. */
export function AttentionSection() {
  const { data: narratives, loading } = useApi<Narrative[]>("/api/narratives");
  const { mode } = useApp();
  const items = [...(narratives ?? [])].sort(
    (a, b) => Math.abs(b.attentionDeltaPct) - Math.abs(a.attentionDeltaPct)
  );
  const max = Math.max(1, ...items.map((n) => Math.abs(n.attentionDeltaPct)));

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading eyebrow="Attention" title="SEE WHERE ATTENTION IS MOVING." />
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <Reveal className="space-y-5">
          {items.slice(0, 5).map((n, i) => {
            const pct = n.attentionDeltaPct;
            const dominant = i === 0;
            return (
              <div key={n.slug} className="group">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={cn(
                      "font-semibold tracking-tight",
                      dominant ? "text-[19px] text-ink" : "text-[14px] text-muted group-hover:text-ink"
                    )}
                  >
                    {n.name}
                    {dominant && (
                      <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                        {n.tokenCount} tokens
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums",
                      dominant ? "text-[22px]" : "text-[14px]",
                      pct >= 0 ? "text-up" : "text-down"
                    )}
                  >
                    {fmtPct(pct)}
                  </span>
                </div>
                <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-edge/70">
                  <div
                    className={cn(
                      "bar-grow h-full rounded-full",
                      pct >= 0
                        ? dominant
                          ? "bg-gradient-to-r from-accent via-up to-up shadow-[0_0_16px_rgba(47,211,138,0.35)]"
                          : "bg-gradient-to-r from-accent/70 to-up/80"
                        : "bg-gradient-to-r from-down/70 to-down"
                    )}
                    style={{ width: `${Math.max(3, (Math.abs(pct) / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-3">
            <Link href="/narratives" className="text-[12px] text-signal hover:underline">
              Explore all narratives →
            </Link>
            <Badge tone={mode === "live" ? "live" : "warn"}>
              {mode === "live" ? "live data" : "demo data"}
            </Badge>
          </div>
        </Reveal>
      )}
    </section>
  );
}

/** NARRATIVES — featured editorial block + hierarchy of the rest. */
export function NarrativesSection() {
  const { data: narratives } = useApi<Narrative[]>("/api/narratives");
  const items = [...(narratives ?? [])].sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct);
  const featured = items[0];
  const rest = items.slice(1, 6);

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading
        eyebrow="Narrative Intelligence"
        title="UNDERSTAND THE NARRATIVE BEFORE THE NOISE."
      />
      {!featured ? (
        <div className="shimmer h-48 rounded-2xl" />
      ) : (
        <>
          <Reveal>
            <Link
              href={`/narrative/${featured.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-edge bg-surface p-8 transition-colors hover:border-edge2 md:p-12"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-[80px]" />
              <div className="relative">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
                  strongest narrative now
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <div className="text-[34px] font-bold leading-none tracking-tight text-ink md:text-[48px]">
                      {featured.name.toUpperCase()}
                    </div>
                    <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
                      {featured.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[44px] font-bold leading-none tabular-nums md:text-[64px]",
                      featured.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                    )}
                  >
                    {fmtPct(featured.attentionDeltaPct)}
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-edge pt-6">
                  {[
                    { label: "attention", value: fmtPct(featured.attentionDeltaPct) },
                    { label: "tokens", value: String(featured.tokenCount) },
                    { label: "24h volume", value: usdCompact(featured.volume24hUsd) },
                    { label: "new launches 24h", value: String(featured.newLaunches24h) },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="font-mono text-[16px] font-bold tabular-nums text-ink">{s.value}</div>
                      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </Reveal>

          <Reveal delay={100} className="mt-4">
            <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
              {rest.map((n, i) => (
                <Link
                  key={n.slug}
                  href={`/narrative/${n.slug}`}
                  className="row-sep group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface2/60"
                >
                  <span className="w-6 font-mono text-[11px] text-faint">{String(i + 2).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-ink group-hover:text-signal">
                    {n.name}
                  </span>
                  <span className="hidden font-mono text-[11px] text-faint sm:block">{n.tokenCount} tokens</span>
                  <span className="hidden w-20 text-right font-mono text-[11px] tabular-nums text-muted sm:block">
                    {usdCompact(n.volume24hUsd)}
                  </span>
                  <span
                    className={cn(
                      "w-16 text-right font-mono text-[14px] font-bold tabular-nums",
                      n.attentionDeltaPct >= 0 ? "text-up" : "text-down"
                    )}
                  >
                    {fmtPct(n.attentionDeltaPct)}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </>
      )}
    </section>
  );
}
