"use client";

import { useEffect, useRef, useState } from "react";
import type { AttentionClassification } from "@/lib/types";

/**
 * Live attention-event derivation (shared by RIGHT NOW + LIVE FEED).
 * Events come from real classification deltas between refreshes; the first
 * load emits a curated, staggered mix so the feed reads like a live wire.
 */

export interface AttentionEvent {
  id: string;
  atMs: number;
  icon: "🐋" | "🔥" | "🤖" | "🧬";
  ticker: string;
  text: string;
  tone: "up" | "accent" | "warn";
  address: string;
}

function classifyEvents(
  prev: Map<string, AttentionClassification>,
  next: AttentionClassification[]
): AttentionEvent[] {
  const events: AttentionEvent[] = [];
  const now = Date.now();
  let i = 0;
  for (const cur of next) {
    const before = prev.get(cur.address);
    const base = {
      id: `${cur.address}:${now}:${i}`,
      atMs: now - i * 4000,
      address: cur.address,
    };
    i++;
    if (!before) continue;
    if ((cur.token.notableWallets ?? 0) > (before.token.notableWallets ?? 0)) {
      events.push({ ...base, icon: "🐋", ticker: cur.token.ticker, text: "Notable wallet entered", tone: "up" });
    } else if (cur.state === "exploding" && before.state !== "exploding") {
      events.push({ ...base, icon: "🔥", ticker: cur.token.ticker, text: "Attention exploding", tone: "up" });
    } else if (cur.state === "accelerating" && before.state === "cooling") {
      events.push({ ...base, icon: "🔥", ticker: cur.token.ticker, text: "Attention accelerating", tone: "accent" });
    } else if (
      cur.token.narrativeTag === "ai-agents" &&
      cur.state !== "flat" &&
      before.state === "flat"
    ) {
      events.push({ ...base, icon: "🤖", ticker: cur.token.ticker, text: "Agent activity detected", tone: "accent" });
    } else if (cur.velocityMultiplier / Math.max(0.01, before.velocityMultiplier) >= 1.5) {
      events.push({ ...base, icon: "🧬", ticker: cur.token.ticker, text: "Attention shifted", tone: "warn" });
    }
  }
  return events.slice(0, 4);
}

function firstLoadEvents(next: AttentionClassification[]): AttentionEvent[] {
  const now = Date.now();
  const out: AttentionEvent[] = [];
  let i = 0;
  const push = (c: AttentionClassification, icon: AttentionEvent["icon"], text: string, tone: AttentionEvent["tone"]) => {
    out.push({
      id: `${c.address}:${now}:first:${i}`,
      atMs: now - i * 8000,
      icon,
      ticker: c.token.ticker,
      text,
      tone,
      address: c.address,
    });
    i++;
  };
  for (const c of next.filter((x) => x.state === "exploding").slice(0, 3)) push(c, "🔥", "Attention exploding", "up");
  for (const c of next.filter((x) => (x.token.notableWallets ?? 0) > 0 && x.state !== "exploding").slice(0, 2)) {
    push(c, "🐋", "Notable wallet entered", "up");
  }
  for (const c of next.filter((x) => x.token.narrativeTag === "ai-agents" && x.state === "accelerating").slice(0, 1)) {
    push(c, "🤖", "Agent activity detected", "accent");
  }
  for (const c of next
    .filter((x) => x.state === "accelerating" && !out.some((o) => o.address === x.address))
    .slice(0, 2)) {
    push(c, "🔥", "Attention accelerating", "accent");
  }
  return out.slice(0, 6);
}

export function useAttentionEvents(
  items: AttentionClassification[],
  max = 12
): { events: AttentionEvent[]; loading: boolean } {
  const prevRef = useRef<Map<string, AttentionClassification>>(new Map());
  const [events, setEvents] = useState<AttentionEvent[]>([]);
  const key = items.map((i) => `${i.address}:${i.state}`).join("|");

  useEffect(() => {
    if (items.length === 0) return;
    const first = prevRef.current.size === 0;
    const fresh = first ? firstLoadEvents(items) : classifyEvents(prevRef.current, items);
    prevRef.current = new Map(items.map((i) => [i.address, i]));
    if (fresh.length > 0) setEvents((old) => [...fresh, ...old].slice(0, max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, max]);

  return { events, loading: items.length === 0 };
}
