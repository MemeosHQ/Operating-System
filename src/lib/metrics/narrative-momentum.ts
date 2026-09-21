import type { Narrative, NarrativeSnapshotLike } from "@/lib/types";

/**
 * NARRATIVE MOMENTUM ENGINE (deterministic, documented)
 *
 * Momentum compares the CURRENT narrative aggregate against a PREVIOUS
 * OBSERVED snapshot from a prior time window (default: the most recent
 * snapshot that is 5–20 minutes old). It never uses a static baseline, so a
 * narrative cannot be punished for simply having low activity.
 *
 * WINDOW: current live aggregates vs. a persisted snapshot from 5–20 minutes ago.
 *
 * COMPONENTS (weights renormalize over the components that have valid data):
 *   volume acceleration   (V_cur − V_prev)/V_prev × 100   weight 0.50
 *   transaction accel.    (T_cur − T_prev)/T_prev × 100   weight 0.30
 *   attention change      (A_cur − A_prev) percentage pts weight 0.15
 *   launch growth         (L_cur − L_prev)/max(L_prev,1)  weight 0.05
 *
 * GUARDS:
 *   - volume acceleration is null when V_prev < $1,000 (too small to rate)
 *   - transaction acceleration is null when T_prev < 50 txns
 *   - momentum is null (BUILDING_BASELINE) when no qualifying previous
 *     snapshot exists, or when BOTH volume and transaction components are
 *     null — low activity is reported honestly, never as −100%.
 *   - result is clamped to ±300.
 *
 * STATUS thresholds on the clamped momentum:
 *   ≥ +25 ACCELERATING · ≥ +5 RISING · > −5 STEADY · > −25 COOLING · ≤ −25 FADING
 */

export const MOMENTUM_WINDOW_MIN_MS = 5 * 60 * 1000;
export const MOMENTUM_WINDOW_MAX_MS = 20 * 60 * 1000;
export const MIN_VOLUME_FOR_RATE = 1_000;
export const MIN_TXNS_FOR_RATE = 50;

export type MomentumStatus =
  | "ACCELERATING"
  | "RISING"
  | "STEADY"
  | "COOLING"
  | "FADING"
  | "BUILDING_BASELINE";

export interface NarrativeCurrent {
  volume24hUsd: number;
  txns24h: number | null;
  attentionDeltaPct: number;
  newLaunches24h: number;
  tokenCount: number;
  activeWallets: number | null;
}

export interface MomentumResult {
  momentumPct: number | null;
  status: MomentumStatus;
  components: {
    volumeAccelPct: number | null;
    txnsAccelPct: number | null;
    attentionChange: number | null;
    launchGrowthPct: number | null;
  };
  windowMinutes: number | null;
}

const WEIGHTS = { volume: 0.5, txns: 0.3, attention: 0.15, launches: 0.05 };

export function momentumStatusLabel(pct: number | null): MomentumStatus {
  if (pct === null) return "BUILDING_BASELINE";
  if (pct >= 25) return "ACCELERATING";
  if (pct >= 5) return "RISING";
  if (pct > -5) return "STEADY";
  if (pct > -25) return "COOLING";
  return "FADING";
}

/** Aggregate change vs. a previous observed snapshot. */
export function computeNarrativeMomentum(
  current: NarrativeCurrent,
  previous: NarrativeSnapshotLike
): MomentumResult {
  const windowMs = previous.capturedAtMs
    ? Math.max(0, previous.capturedAtMs)
    : null;
  const windowMinutes =
    windowMs !== null ? Math.round((windowMs / 60_000) * 10) / 10 : null;

  const volAccelPct =
    previous.volume24hUsd >= MIN_VOLUME_FOR_RATE
      ? Math.round(((current.volume24hUsd - previous.volume24hUsd) / previous.volume24hUsd) * 1000) / 10
      : null;

  const txnsAccelPct =
    previous.txns24h !== null &&
    previous.txns24h !== undefined &&
    previous.txns24h >= MIN_TXNS_FOR_RATE &&
    current.txns24h !== null
      ? Math.round(((current.txns24h - previous.txns24h) / previous.txns24h) * 1000) / 10
      : null;

  const attentionChange =
    Math.round((current.attentionDeltaPct - previous.attentionDeltaPct) * 10) / 10;

  const launchGrowthPct =
    previous.newLaunches24h > 0
      ? Math.round(((current.newLaunches24h - previous.newLaunches24h) / previous.newLaunches24h) * 1000) / 10
      : null;

  // Weighted sum over available components (renormalized).
  const parts: { weight: number; value: number }[] = [];
  if (volAccelPct !== null) parts.push({ weight: WEIGHTS.volume, value: volAccelPct });
  if (txnsAccelPct !== null) parts.push({ weight: WEIGHTS.txns, value: txnsAccelPct });
  if (volAccelPct !== null || txnsAccelPct !== null) {
    // Attention/launch deltas only count when real rate components exist,
    // otherwise they would fabricate momentum for a dead narrative.
    parts.push({ weight: WEIGHTS.attention, value: attentionChange });
    if (launchGrowthPct !== null) parts.push({ weight: WEIGHTS.launches, value: launchGrowthPct });
  }

  if (parts.length === 0) {
    return {
      momentumPct: null,
      status: "BUILDING_BASELINE",
      components: { volumeAccelPct: volAccelPct, txnsAccelPct, attentionChange: null, launchGrowthPct },
      windowMinutes,
    };
  }

  const totalWeight = parts.reduce((a, p) => a + p.weight, 0);
  const momentumPct = Math.max(
    -300,
    Math.min(300, Math.round((parts.reduce((a, p) => a + p.weight * p.value, 0) / totalWeight) * 10) / 10)
  );

  return {
    momentumPct,
    status: momentumStatusLabel(momentumPct),
    components: { volumeAccelPct: volAccelPct, txnsAccelPct, attentionChange, launchGrowthPct },
    windowMinutes,
  };
}

/** Pick the previous snapshot inside the 5–20 minute comparison window. */
export function pickPreviousSnapshot<T extends { capturedAtMs: number }>(
  history: T[],
  now: number
): T | null {
  const candidates = history
    .filter(
      (h) =>
        now - h.capturedAtMs >= MOMENTUM_WINDOW_MIN_MS &&
        now - h.capturedAtMs <= MOMENTUM_WINDOW_MAX_MS
    )
    .sort((a, b) => b.capturedAtMs - a.capturedAtMs);
  return candidates[0] ?? null;
}

/** Rank key: real momentum first; narratives still building sort by |attention|. */
export function momentumRankValue(n: Narrative): number {
  if (n.momentumPct !== null && n.momentumPct !== undefined) {
    return 10_000 + n.momentumPct;
  }
  return Math.abs(n.attentionDeltaPct);
}
