import { describe, it, expect } from "vitest";
import {
  computeNarrativeMomentum,
  pickPreviousSnapshot,
  momentumStatusLabel,
} from "../src/lib/metrics/narrative-momentum";

describe("narrative momentum engine", () => {
  const prev = {
    volume24hUsd: 1_000_000,
    txns24h: 1_000,
    attentionDeltaPct: 0,
    newLaunches24h: 10,
    tokenCount: 20,
    capturedAtMs: 0,
  };

  it("computes a volume-driven momentum rise", () => {
    const r = computeNarrativeMomentum(
      { volume24hUsd: 1_200_000, txns24h: 1_000, attentionDeltaPct: 0, newLaunches24h: 10, tokenCount: 20, activeWallets: null },
      prev
    );
    // vol accel +20% dominates (weight 0.5, renormalized) → +10
    expect(r.momentumPct!).toBe(10);
    expect(r.status).toBe("RISING");
    expect(r.components.volumeAccelPct).toBe(20);
  });

  it("computes a fade when volume drops", () => {
    const r = computeNarrativeMomentum(
      { volume24hUsd: 500_000, txns24h: 1_000, attentionDeltaPct: 0, newLaunches24h: 10, tokenCount: 20, activeWallets: null },
      prev
    );
    // vol accel −50% × weight 0.5 → −25
    expect(r.momentumPct!).toBe(-25);
    expect(r.status).toBe("FADING");
  });

  it("returns BUILDING_BASELINE when previous volume is too small to rate", () => {
    const r = computeNarrativeMomentum(
      { volume24hUsd: 500, txns24h: null, attentionDeltaPct: 0, newLaunches24h: 0, tokenCount: 3, activeWallets: null },
      { volume24hUsd: 300, txns24h: null, attentionDeltaPct: 0, newLaunches24h: 0, tokenCount: 3, capturedAtMs: 0 }
    );
    expect(r.momentumPct).toBeNull();
    expect(r.status).toBe("BUILDING_BASELINE");
  });

  it("NEVER produces −100% or fake 0% from missing history", () => {
    const r = computeNarrativeMomentum(
      { volume24hUsd: 0, txns24h: null, attentionDeltaPct: 0, newLaunches24h: 0, tokenCount: 1, activeWallets: null },
      { volume24hUsd: 0, txns24h: null, attentionDeltaPct: 0, newLaunches24h: 0, tokenCount: 1, capturedAtMs: 0 }
    );
    expect(r.momentumPct).toBeNull();
    expect(r.status).toBe("BUILDING_BASELINE");
  });

  it("uses launch growth only as a small supporting component", () => {
    // 10 → 20 launches (+100% launch growth, small weight) with flat volume
    const r = computeNarrativeMomentum(
      { volume24hUsd: 1_000_000, txns24h: 1_000, attentionDeltaPct: 0, newLaunches24h: 20, tokenCount: 20, activeWallets: null },
      prev
    );
    expect(r.momentumPct!).toBeGreaterThan(0);
    expect(r.momentumPct!).toBeLessThan(10); // launch weight is only 0.05
  });
});

describe("momentum window selection", () => {
  const now = 10_000_000;
  it("picks the newest snapshot inside the 5–20 min window", () => {
    const prev = pickPreviousSnapshot(
      [
        { capturedAtMs: now - 2 * 60_000 }, // too fresh
        { capturedAtMs: now - 8 * 60_000 }, // in window — newest in window
        { capturedAtMs: now - 12 * 60_000 }, // in window — older
        { capturedAtMs: now - 40 * 60_000 }, // too old
      ],
      now
    );
    expect(prev!.capturedAtMs).toBe(now - 8 * 60_000);
  });

  it("returns null when no snapshot is in the window", () => {
    expect(
      pickPreviousSnapshot([{ capturedAtMs: now - 60_000 }, { capturedAtMs: now - 60 * 60_000 }], now)
    ).toBeNull();
  });
});

describe("status thresholds", () => {
  it("maps momentum to honest statuses", () => {
    expect(momentumStatusLabel(50)).toBe("ACCELERATING");
    expect(momentumStatusLabel(10)).toBe("RISING");
    expect(momentumStatusLabel(2)).toBe("STEADY");
    expect(momentumStatusLabel(-10)).toBe("COOLING");
    expect(momentumStatusLabel(-40)).toBe("FADING");
    expect(momentumStatusLabel(null)).toBe("BUILDING_BASELINE");
  });
});
