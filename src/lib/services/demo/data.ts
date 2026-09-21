import { hashString, mulberry32 } from "@/lib/utils";
import { withAttention } from "@/lib/metrics/attention";
import type { LaunchEvent, TokenMetrics } from "@/lib/types";

/**
 * DETERMINISTIC DEMO DATASET — tokens.
 * Fixed seeds (no Math.random) so SSR/client renders match. Demo data is
 * ALWAYS labeled DEMO in the UI and never presented as live.
 */

const NAME_POOL: Record<string, [name: string, ticker: string][]> = {
  "ai-agents": [
    ["DogeMind", "DOGAI"],
    ["NeuralCat", "NCAT"],
    ["AgentZeta", "ZETA"],
    ["SolGPT", "SGPT"],
    ["AutoMeme", "AMEME"],
    ["SynthPup", "SPUP"],
  ],
  cats: [
    ["MidnightWhisker", "MEOW"],
    ["PurrCoin", "PURR"],
    ["VoidKitty", "VKIT"],
    ["ChonkLord", "CHNK"],
  ],
  dogs: [
    ["DogeSon", "DSON"],
    ["WoofMatrix", "WOOF"],
    ["ShibaBlaze", "SBLZ"],
    ["PupRocket", "PRKT"],
  ],
  anime: [
    ["SakuraRush", "SAKU"],
    ["WaifuProtocol", "WAIFU"],
    ["OtakuOps", "OTAK"],
  ],
  politics: [
    ["VoteDoge", "VOTE"],
    ["CapitolPaws", "CAPW"],
  ],
  meta: [
    ["PumpVerse", "PUMPV"],
    ["DegenDial", "DEGEN"],
    ["MoonLedger", "MNLD"],
    ["MemeGrid", "MGRID"],
  ],
};

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Deterministic base58-style address (passes Solana format validation). */
export function fakeAddress(seed: string): string {
  const rng = mulberry32(hashString(seed));
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += B58[Math.floor(rng() * B58.length)];
  }
  return out;
}

export interface DemoToken extends TokenMetrics {
  slug: string;
  seed: number;
}

function buildTokens(): DemoToken[] {
  const tokens: DemoToken[] = [];
  let idx = 0;
  for (const [slug, pool] of Object.entries(NAME_POOL)) {
    for (const [name, ticker] of pool) {
      const rng = mulberry32(hashString(`${name}:${ticker}:memeos`));
      const ageMinutes = Math.round(5 + rng() * 60 * 40); // 5m … ~40h
      const mc = Math.round(15_000 + rng() * rng() * 4_000_000);
      const volume = Math.round(mc * (0.3 + rng() * 4));
      const txns = Math.max(12, Math.round(volume / (300 + rng() * 900)));
      const buys = Math.round(txns * (0.4 + rng() * 0.25));
      const status =
        rng() > 0.88 ? "graduated" : ageMinutes < 45 ? "new" : "bonding";
      const t: DemoToken = {
        slug,
        seed: hashString(ticker),
        address: fakeAddress(`mint:${ticker}`),
        name,
        ticker: `$${ticker}`,
        marketCapUsd: mc,
        liquidityUsd: Math.round(mc * (0.05 + rng() * 0.2)),
        volume24hUsd: volume,
        priceUsd: mc / (700_000_000 + Math.round(rng() * 200_000_000)),
        priceChange24hPct: Number(((rng() - 0.35) * 220).toFixed(1)),
        ageMinutes,
        holders: Math.round(30 + rng() * 4_800),
        txns24h: txns,
        buys24h: buys,
        sells24h: txns - buys,
        notableWallets: rng() > 0.55 ? Math.round(1 + rng() * 4) : 0,
        narrativeTag: slug,
        status: status as TokenMetrics["status"],
        creatorAddress: fakeAddress(`creator:${Math.floor(idx / 3)}`),
      };
      tokens.push(withAttention(t) as DemoToken);
      idx++;
    }
  }
  return tokens;
}

export const DEMO_TOKENS: DemoToken[] = buildTokens();

export const demoTokens: TokenMetrics[] = DEMO_TOKENS;

export function demoTokenByAddress(address: string): TokenMetrics | undefined {
  return DEMO_TOKENS.find((t) => t.address === address);
}

export function demoTokensByNarrative(slug: string): TokenMetrics[] {
  return DEMO_TOKENS.filter((t) => t.slug === slug);
}

/** First-60-second replay events, generated deterministically per token. */
export function buildLaunchEvents(t: TokenMetrics): LaunchEvent[] {
  const rng = mulberry32(hashString(`replay:${t.address}`));
  const events: LaunchEvent[] = [
    { tSeconds: 0, kind: "launch", label: "Token launched on Pump.fun" },
  ];
  const marks = [4, 11, 18, 24, 37, 51];
  let buyers = 0;
  for (const s of marks) {
    buyers += Math.round(6 + rng() * 28);
    if (s === 18 && rng() > 0.4) {
      events.push({ tSeconds: s, kind: "whale", label: "Whale detected", detail: "Large single buy observed" });
    } else if (s === 24) {
      events.push({ tSeconds: s, kind: "volume", label: "Volume acceleration", detail: "Buy rate above launch baseline" });
    } else if (s === 37) {
      events.push({ tSeconds: s, kind: "holders", label: "Holder growth", detail: `${buyers + 9} holders` });
    } else if (s === 51 && (t.notableWallets ?? 0) > 0) {
      events.push({ tSeconds: s, kind: "smart-wallet", label: "Smart wallet interaction", detail: `${t.notableWallets} notable wallet(s)` });
    } else {
      events.push({ tSeconds: s, kind: "buyers", label: `${buyers} buyers` });
    }
  }
  events.push({
    tSeconds: 60,
    kind: "snapshot",
    label: "Launch snapshot",
    detail: `$${Math.max(1, Math.round(t.marketCapUsd / 1000))}K market cap at 60s`,
  });
  if (t.status === "graduated") {
    events.push({ tSeconds: 60 + Math.round(rng() * 600), kind: "graduation", label: "Graduated to PumpSwap" });
  }
  return events;
}
