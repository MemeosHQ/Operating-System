import { describe, it, expect } from "vitest";
import {
  attentionMultiplier,
  attentionVelocityScore,
  classifyAttention,
  BASELINES,
} from "@/lib/metrics/attention";
import { computeDnaDimensions, buildDnaProfile } from "@/lib/metrics/dna";
import {
  narrativeAttentionDeltaPct,
  classifyTokenNarrative,
  narrativeVolumeUsd,
} from "@/lib/metrics/narrative";
import { lifecycleStage, launchMomentumScore } from "@/lib/metrics/lifecycle";
import type { TokenMetrics } from "@/lib/types";

function makeToken(over: Partial<TokenMetrics> = {}): TokenMetrics {
  return {
    address: "TEstAddr000000000000000000000000000000000000",
    name: "Test",
    ticker: "$TST",
    marketCapUsd: 100_000,
    liquidityUsd: 20_000,
    volume24hUsd: 50_000,
    priceUsd: 0.0001,
    priceChange24hPct: 10,
    ageMinutes: 120,
    narrativeTag: "meta",
    status: "bonding",
    ...over,
  };
}

describe("attention metrics", () => {
  it("flat activity maps to multiplier ≈ 1 and a low score", () => {
    // 120 min old, 10_800 volume = 1.5 vol/s exactly at baseline
    const t = makeToken({ volume24hUsd: 10_800, txns24h: 144, buys24h: 72, ageMinutes: 120 });
    const m = attentionMultiplier(t);
    expect(m).toBeCloseTo(1, 1);
    expect(attentionVelocityScore(m)).toBeLessThan(30);
  });

  it("exploding activity is classified as exploding", () => {
    const t = makeToken({ volume24hUsd: 500_000, txns24h: 3_000, buys24h: 2_000, ageMinutes: 120 });
    const info = classifyAttention({ ...t, volumeDeltaPct: 120 });
    expect(info.state).toBe("exploding");
    expect(info.velocityMultiplier).toBeGreaterThan(BASELINES.explodingAt);
  });

  it("cooling requires both low multiplier and falling volume", () => {
    const quiet = classifyAttention({
      volume24hUsd: 1_000,
      txns24h: 5,
      buys24h: 2,
      ageMinutes: 600,
      volumeDeltaPct: -50,
    });
    expect(quiet.state).toBe("cooling");
  });

  it("score is monotonic in multiplier and clamped 0–100", () => {
    expect(attentionVelocityScore(1)).toBeLessThan(attentionVelocityScore(4));
    expect(attentionVelocityScore(4)).toBeLessThan(attentionVelocityScore(100));
    expect(attentionVelocityScore(1_000_000)).toBe(100);
    expect(attentionVelocityScore(0)).toBe(0);
  });

  it("missing inputs never crash — multiplier falls back to 1", () => {
    expect(attentionMultiplier({ volume24hUsd: 0, ageMinutes: 5 })).toBe(1);
  });
});

describe("meme DNA", () => {
  it("produces 8 dimensions, all 0–100, each with a basis", () => {
    const t = makeToken({ holders: 1_200, notableWallets: 2, txns24h: 400, buys24h: 250, sells24h: 150 });
    const { dimensions } = computeDnaDimensions(t);
    expect(dimensions).toHaveLength(8);
    for (const d of dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.basis.length).toBeGreaterThan(5);
    }
  });

  it("flags missing holders honestly via availability, using a labeled proxy", () => {
    const t = makeToken({ holders: undefined });
    const profile = buildDnaProfile(t);
    const hq = profile.dimensions.find((d) => d.key === "holderQuality")!;
    expect(hq.basis).toContain("proxy");
    expect(profile.availability.unavailable.some((u) => u.capability === "Holder analytics")).toBe(true);
  });

  it("smart-money score reflects observed notable wallets, not fabrication", () => {
    const none = buildDnaProfile(makeToken({ notableWallets: 0 }));
    const some = buildDnaProfile(makeToken({ notableWallets: 3 }));
    const a = none.dimensions.find((d) => d.key === "smartMoney")!;
    const b = some.dimensions.find((d) => d.key === "smartMoney")!;
    expect(b.score).toBeGreaterThan(a.score);
  });
});

describe("narrative momentum", () => {
  it("neutral velocity tokens yield 0% narrative delta", () => {
    const tokens = [makeToken({ attentionVelocity: 50 }), makeToken({ attentionVelocity: 50 })];
    expect(narrativeAttentionDeltaPct(tokens)).toBe(0);
  });

  it("a +100 and a 0 velocity delta average to +50%", () => {
    const tokens = [makeToken({ attentionVelocity: 100 }), makeToken({ attentionVelocity: 50 })];
    expect(narrativeAttentionDeltaPct(tokens)).toBe(50);
  });

  it("tokens without velocity contribute nothing (never inflate)", () => {
    const tokens = [makeToken({ attentionVelocity: 100 }), makeToken({ attentionVelocity: undefined })];
    expect(narrativeAttentionDeltaPct(tokens)).toBe(100);
  });

  it("volumes aggregate", () => {
    expect(narrativeVolumeUsd([makeToken({ volume24hUsd: 10 }), makeToken({ volume24hUsd: 15 })])).toBe(25);
  });

  it("taxonomy classifies by keyword deterministically", () => {
    expect(classifyTokenNarrative("DogeMind AI agents", "DOGAI")).toBe("ai-agents");
    expect(classifyTokenNarrative("MidnightWhisker", "MEOW")).toBe("cats");
    expect(classifyTokenNarrative("Whatever", "XYZ")).toBe("meta");
  });
});

describe("lifecycle", () => {
  it("classifies graduated first", () => {
    expect(lifecycleStage(makeToken({ status: "graduated" }))).toBe("graduated");
  });
  it("classifies embryonic for very young, quiet tokens", () => {
    const t = makeToken({ ageMinutes: 10, attentionVelocity: 10 });
    expect(lifecycleStage(t)).toBe("embryonic");
  });
  it("classifies ignition on high velocity", () => {
    const t = makeToken({ ageMinutes: 90, attentionVelocity: 80 });
    expect(lifecycleStage(t)).toBe("ignition");
  });
  it("classifies decay on deep drawdown", () => {
    const t = makeToken({ ageMinutes: 600, attentionVelocity: 20, priceChange24hPct: -60 });
    expect(lifecycleStage(t)).toBe("decay");
  });
  it("launch momentum is bounded 0–100", () => {
    const s = launchMomentumScore(makeToken({ attentionVelocity: 90, buys24h: 800, txns24h: 1000, ageMinutes: 10 }));
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
