import { clamp } from "@/lib/utils";
import type {
  AttentionState,
  AttentionStateInfo,
  TokenMetrics,
} from "@/lib/types";

/**
 * ATTENTION VELOCITY (deterministic, documented)
 *
 * Inputs are observable 24h counters:
 *   v24 = volume24hUsd, t24 = txns24h, b24 = buys24h
 *
 * Baseline "flat" rates for a mid-cap meme token:
 *   vol/s  ≈ 1.5, txn/s ≈ 0.02, buy/s ≈ 0.01  (per second of token age)
 *
 * velocityMultiplier = median(volRate/vBase, txnRate/tBase, buyRate/bBase)
 *   → how many× the token's own baseline the current activity runs.
 *
 * attentionVelocity (0–100) maps the multiplier through a log scale so that
 * 1× → ~18, 4× → ~55, 10× → ~78, 25×+ → 100:
 *   score = clamp(round(100 * log2(1 + m) / log2(1 + 25)), 0, 100)
 */

export const BASELINES = {
  volumePerSecond: 1.5,
  txnsPerSecond: 0.02,
  buysPerSecond: 0.01,
  /** Multiplier above which activity is classified as exploding. */
  explodingAt: 4,
  acceleratingAt: 1.6,
} as const;

export interface AttentionInputs {
  volume24hUsd: number;
  txns24h?: number;
  buys24h?: number;
  ageMinutes: number;
}

function rate(value: number | undefined, ageSeconds: number, base: number) {
  if (!value || value <= 0 || ageSeconds <= 0) return null;
  const r = value / ageSeconds / base;
  return isFinite(r) && r > 0 ? r : null;
}

export function attentionMultiplier(input: AttentionInputs): number {
  const ageSeconds = Math.max(60, input.ageMinutes * 60);
  const rates = [
    rate(input.volume24hUsd, ageSeconds, BASELINES.volumePerSecond),
    rate(input.txns24h, ageSeconds, BASELINES.txnsPerSecond),
    rate(input.buys24h, ageSeconds, BASELINES.buysPerSecond),
  ].filter((r): r is number => r !== null);
  if (rates.length === 0) return 1;
  rates.sort((a, b) => a - b);
  return rates[Math.floor(rates.length / 2)];
}

export function attentionVelocityScore(multiplier: number): number {
  const m = Math.max(0.01, multiplier);
  return clamp(Math.round((100 * Math.log2(1 + m)) / Math.log2(26)), 0, 100);
}

export function classifyAttention(
  input: AttentionInputs & { volumeDeltaPct?: number; buyerDeltaPct?: number }
): AttentionStateInfo {
  const m = attentionMultiplier(input);
  const volumeDeltaPct = input.volumeDeltaPct ?? 0;
  const buyerDeltaPct = input.buyerDeltaPct ?? 0;

  let state: AttentionState;
  let reason: string;
  if (m >= BASELINES.explodingAt) {
    state = "exploding";
    reason = `Activity running ${m.toFixed(1)}× baseline — volume ${
      volumeDeltaPct >= 0 ? "up" : "down"
    } ${Math.abs(volumeDeltaPct).toFixed(0)}%.`;
  } else if (m >= BASELINES.acceleratingAt) {
    state = "accelerating";
    reason = `Momentum building at ${m.toFixed(1)}× baseline activity.`;
  } else if (m < 0.55 && volumeDeltaPct < -20) {
    state = "cooling";
    reason = `Activity at ${m.toFixed(1)}× baseline — volume down ${Math.abs(
      volumeDeltaPct
    ).toFixed(0)}%.`;
  } else {
    state = "flat";
    reason = `Activity steady at ${m.toFixed(1)}× baseline.`;
  }
  return { state, velocityMultiplier: m, volumeDeltaPct, buyerDeltaPct, reason };
}

export function withAttention(t: TokenMetrics): TokenMetrics {
  const velocity = attentionVelocityScore(attentionMultiplier(t));
  return { ...t, attentionVelocity: velocity };
}

export function classifyToken(t: TokenMetrics): AttentionStateInfo & {
  address: string;
  token: TokenMetrics;
} {
  const info = classifyAttention(t);
  return { address: t.address, token: t, ...info };
}
