import { hashString, mulberry32 } from "@/lib/utils";
import type { AgentProfile, CreatorProfile, TokenMetrics } from "@/lib/types";
import { DEMO_TOKENS, fakeAddress } from "./data";

/** DETERMINISTIC DEMO DATASET — creators and agents. */

export function demoCreators(): CreatorProfile[] {
  const byCreator = new Map<string, TokenMetrics[]>();
  for (const t of DEMO_TOKENS) {
    if (!t.creatorAddress) continue;
    const list = byCreator.get(t.creatorAddress) ?? [];
    list.push(t);
    byCreator.set(t.creatorAddress, list);
  }
  const creators: CreatorProfile[] = [];
  for (const [address, tokens] of byCreator) {
    const rng = mulberry32(hashString(address));
    const successful =
      tokens.filter((t) => t.status === "graduated").length +
      (tokens.some((t) => t.marketCapUsd > 500_000) ? 1 : 0);
    const avgPeak = Math.round(
      tokens.reduce((a, t) => a + t.marketCapUsd * (1.4 + rng()), 0) / tokens.length
    );
    creators.push({
      address,
      launchCount: tokens.length,
      successfulLaunches: Math.min(successful, tokens.length),
      avgPeakMarketCapUsd: avgPeak,
      medianLifespanMinutes: Math.round(240 + rng() * 4_000),
      launchFrequencyPerWeek: Number((tokens.length / (2 + rng() * 8)).toFixed(1)),
      recurringNarratives: [...new Set(tokens.map((t) => t.narrativeTag))],
      tokens,
      firstLaunchMs: Math.min(...tokens.map((t) => Date.now() - t.ageMinutes * 60_000)),
    });
  }
  return creators;
}

export function demoCreator(address: string): CreatorProfile | undefined {
  return demoCreators().find((c) => c.address === address);
}

/** Agents are wallets whose behavior pattern matches bot-like cadence. */
export function demoAgents(): AgentProfile[] {
  const rng = mulberry32(4242);
  const behaviors = [
    "Launch discovery — buys within seconds of new Pump.fun launches",
    "Narrative rotation — concentrated in AI-agent themed tokens",
    "High-frequency small buys across fresh bonds",
    "Volume provision — alternating buys/sells on trending tokens",
  ];
  return Array.from({ length: 4 }, (_, i) => {
    const touched = Array.from(
      { length: 3 + Math.floor(rng() * 5) },
      () => DEMO_TOKENS[Math.floor(rng() * DEMO_TOKENS.length)]
    );
    const unique = [...new Map(touched.map((t) => [t.address, t])).values()];
    const count = Math.round(40 + rng() * 400);
    return {
      address: fakeAddress(`agent:${i}`),
      name: `agent-${fakeAddress(`agent:${i}`).slice(0, 6)}`,
      activity: count > 200 ? "HIGH" : count > 100 ? "MEDIUM" : "LOW",
      behavior: behaviors[i % behaviors.length],
      interactionCount: count,
      launchesInvolved: Math.round(2 + rng() * 9),
      tokensTouched: unique.slice(0, 6).map((t) => t.address),
      lastActiveMs: Date.now() - Math.round(rng() * 90) * 60_000,
    } satisfies AgentProfile;
  });
}
