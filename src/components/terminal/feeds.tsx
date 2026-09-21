"use client";

import { useAttentionEvents, type AttentionEvent } from "@/lib/hooks/use-attention-events";
import type { AttentionClassification } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<AttentionEvent["tone"], string> = {
  up: "text-up",
  accent: "text-accent-soft",
  warn: "text-warn",
};

/**
 * RIGHT NOW — a flowing editorial feed. Typography + hairline separators,
 * no rounded boxes; each line breathes.
 */
export function RightNow({
  items,
  onSelect,
}: {
  items: AttentionClassification[];
  onSelect: (address: string) => void;
}) {
  const { events, loading } = useAttentionEvents(items, 6);

  return (
    <div>
      {loading && (
        <div className="space-y-4 py-2">
          {[0, 1, 2].map((i) => <div key={i} className="shimmer h-5 w-4/5 rounded" />)}
        </div>
      )}
      {!loading && events.length === 0 && (
        <p className="py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          No signals yet — listening…
        </p>
      )}
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.address)}
          className="row-sep group block w-full py-3.5 text-left transition-colors first:pt-1 hover:bg-surface2/30"
        >
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] leading-none">{e.icon}</span>
            <span className="font-mono text-[15px] font-bold tracking-tight text-ink group-hover:text-signal">
              {e.ticker}
            </span>
            <span className={cn("truncate text-[13px]", TONE[e.tone])}>{e.text}</span>
          </div>
        </button>
      ))}
      <p className="mt-3 px-1 text-[10px] leading-relaxed text-faint">
        Derived from real classification changes between refreshes — never invented.
      </p>
    </div>
  );
}

/**
 * LIVE FEED — newswire style. Mono clock + ticker + event, hairline rows.
 */
export function LiveFeed({
  items,
  onSelect,
}: {
  items: AttentionClassification[];
  onSelect: (address: string) => void;
}) {
  const { events, loading } = useAttentionEvents(items, 12);

  return (
    <div className="font-mono text-[11px]">
      {loading && <div className="shimmer h-24 rounded" />}
      {!loading && events.length === 0 && (
        <p className="py-4 uppercase tracking-[0.2em] text-faint">wire quiet…</p>
      )}
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.address)}
          className="row-sep grid w-full grid-cols-[52px_64px_1fr] items-baseline gap-2 py-2 text-left transition-colors hover:bg-surface2/40"
        >
          <span className="tabular-nums text-faint">
            {new Date(e.atMs).toTimeString().slice(0, 8)}
          </span>
          <span className="font-bold text-ink">{e.ticker}</span>
          <span className={cn("truncate", TONE[e.tone])}>{e.text}</span>
        </button>
      ))}
    </div>
  );
}
