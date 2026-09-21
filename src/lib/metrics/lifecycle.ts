import type { LifecycleStage, TokenMetrics } from "@/lib/types";

/**
 * TOKEN LIFECYCLE (deterministic, documented)
 *
 * Stage classification from observable metrics:
 *   graduated : status === "graduated" (left the bonding curve)
 *   embryonic : age < 30m AND attention velocity < 30
 *   ignition  : attention velocity >= 60
 *   expansion : age < 24h AND velocity >= 30
 *   decay     : price down > 40% over 24h
 *   stall     : everything else — trading but without a directional signal
 */

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  embryonic: "Embryonic",
  ignition: "Ignition",
  expansion: "Expansion",
  stall: "Stall",
  decay: "Decay",
  graduated: "Graduated",
};

export function lifecycleStage(t: TokenMetrics): LifecycleStage {
  const v = t.attentionVelocity ?? 0;
  if (t.status === "graduated") return "graduated";
  if (t.priceChange24hPct < -40 && t.ageMinutes > 60) return "decay";
  if (t.ageMinutes < 30 && v < 30) return "embryonic";
  if (v >= 60) return "ignition";
  if (t.ageMinutes < 60 * 24 && v >= 30) return "expansion";
  return "stall";
}

/**
 * Launch momentum (0–100): how strongly the first trading window is moving.
 * Formula: 40% attention velocity + 30% buy pressure + 30% early age bonus.
 */
export function launchMomentumScore(t: TokenMetrics): number {
  const v = (t.attentionVelocity ?? 0) * 0.4;
  const buys =
    t.buys24h && t.txns24h && t.txns24h > 0
      ? (t.buys24h / t.txns24h) * 100 * 0.3
      : 15;
  const ageBonus = t.ageMinutes < 60 ? 30 : t.ageMinutes < 360 ? 15 : 5;
  return Math.round(Math.min(100, v + buys + ageBonus));
}
