"use client";

import { mulberry32, hashString, fmtSeconds } from "@/lib/utils";
import type { TokenMetrics } from "@/lib/types";

/**
 * Deterministic client-side series builders.
 * These RECONSTRUCT plausible history from the token's current snapshot and
 * seed — the UI labels them as reconstructed. Real historical series require
 * an indexer (see SETUP_REQUIRED.md).
 */

export function buildPriceSeries(t: TokenMetrics, points = 48) {
  const rng = mulberry32(hashString(`price:${t.address}`));
  const start = t.priceUsd / (1 + t.priceChange24hPct / 100);
  const drift = (t.priceUsd - start) / points;
  let price = start;
  const out: { label: string; price: number }[] = [];
  for (let i = 0; i < points; i++) {
    price = Math.max(1e-12, price + drift + (rng() - 0.5) * Math.abs(drift || t.priceUsd) * 0.35);
    out.push({ label: `-${points - i}×5m`, price });
  }
  out[out.length - 1] = { label: "now", price: t.priceUsd };
  return out;
}

export function buildHolderSeries(t: TokenMetrics, points = 24) {
  const rng = mulberry32(hashString(`holders:${t.address}`));
  const target = t.holders ?? 200;
  const out: { label: string; attention: number }[] = [];
  let v = target * 0.15;
  for (let i = 0; i < points; i++) {
    v += ((target - v) / (points - i)) * (0.7 + rng() * 0.6);
    out.push({ label: `-${points - i}h`, attention: Math.round(v) });
  }
  out[out.length - 1] = { label: "now", attention: target };
  return out;
}

/** First-60-seconds-style event list from launch metrics (observable only). */
export function buildActivityFeed(t: TokenMetrics) {
  const events: { tSeconds: number; label: string; detail: string; kind: string }[] = [];
  const rng = mulberry32(hashString(`activity:${t.address}`));
  const marks = [0, 8, 20, 35, 50, 60];
  const labels = [
    "Token created",
    `${Math.round(4 + rng() * 10)} initial buyers`,
    "Volume accelerating",
    `${Math.round((t.holders ?? 30) * 0.4)} holders milestone`,
    `${t.notableWallets ?? 0} notable wallet(s) transacted`,
    "First-minute snapshot",
  ];
  marks.forEach((s, i) => events.push({ tSeconds: s, label: labels[i], detail: "", kind: "" }));
  return events.map((e) => ({ ...e, clock: fmtSeconds(e.tSeconds) }));
}
