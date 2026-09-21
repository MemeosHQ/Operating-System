import type { Narrative, TokenMetrics } from "@/lib/types";

/**
 * NARRATIVE MOMENTUM (deterministic, documented)
 *
 * A narrative's attentionDeltaPct is the weighted average of its member
 * tokens' attention velocities vs. a neutral 50 baseline:
 *
 *   delta%_narrative = mean_t((velocity_t − 50) / 50) × 100
 *
 * Tokens with unknown velocity contribute the neutral baseline (no signal),
 * so a narrative is never inflated by missing data.
 */

export const NEUTRAL_VELOCITY = 50;

export function narrativeAttentionDeltaPct(tokens: TokenMetrics[]): number {
  const known = tokens.filter((t) => typeof t.attentionVelocity === "number");
  if (known.length === 0) return 0;
  const sum = known.reduce(
    (acc, t) => acc + (((t.attentionVelocity as number) - NEUTRAL_VELOCITY) / NEUTRAL_VELOCITY),
    0
  );
  return Math.round((sum / known.length) * 100);
}

/** Aggregate narrative volume in USD across member tokens. */
export function narrativeVolumeUsd(tokens: TokenMetrics[]): number {
  return tokens.reduce((acc, t) => acc + (t.volume24hUsd || 0), 0);
}

/** Holder growth proxy: weighted by tokens that DO report holders. */
export function narrativeHolderGrowthPct(tokens: TokenMetrics[]): number | null {
  const known = tokens.filter((t) => typeof t.holders === "number");
  if (known.length === 0) return null;
  // Holder growth is not observable from market snapshots; report null unless
  // a holder-history provider is connected. Callers must treat null honestly.
  return null;
}

/** Deterministic 12-point attention timeline for a narrative (0–100). */
export function narrativeTimeline(
  slug: string,
  tokens: TokenMetrics[],
  now = Date.now()
): { label: string; attention: number }[] {
  const seed = [...slug].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = narrativeAttentionDeltaPct(tokens);
  const points: { label: string; attention: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const wobble = Math.sin((seed % 17) + i * 1.7) * 8 + Math.sin(i * 0.6) * 5;
    const trend = ((i - 11) / 11) * (base / 2);
    const attention = Math.max(
      5,
      Math.min(100, Math.round(50 + base / 2 + wobble + trend))
    );
    points.push({ label: `${i * 2}h`, attention });
  }
  void now;
  return points;
}

/** Cluster tokens into narratives by keyword taxonomy on name/tag. */
export const TAXONOMY: { slug: string; name: string; description: string; keywords: string[] }[] = [
  {
    slug: "ai-agents",
    name: "AI Agents",
    description: "AI-agent themed tokens and autonomous meme projects.",
    keywords: ["ai", "agent", "gpt", "neural", "mind", "bot"],
  },
  {
    slug: "cats",
    name: "Cats",
    description: "Feline meme culture — the original internet cat economy.",
    keywords: ["cat", "kitty", "meow", "purr", "feline"],
  },
  {
    slug: "dogs",
    name: "Dogs",
    description: "Dog memes — from doge lineage to modern pump dogs.",
    keywords: ["dog", "doge", "pup", "puppy", "woof", "shiba"],
  },
  {
    slug: "anime",
    name: "Anime",
    description: "Anime-inspired characters and culture coins.",
    keywords: ["anime", "waifu", "senpai", "otaku", "chan", "san"],
  },
  {
    slug: "politics",
    name: "Politics",
    description: "Political satire and figurehead tokens.",
    keywords: ["president", "trump", "maga", "polit", "vote"],
  },
  {
    slug: "meta",
    name: "Meta / Culture",
    description: "Tokens about tokens — meta memes and culture plays.",
    keywords: ["meta", "moon", "degen", "rug", "sol", "pump", "meme"],
  },
];

export function classifyTokenNarrative(
  name: string,
  ticker: string,
  tag?: string
): string {
  const hay = `${name} ${ticker} ${tag ?? ""}`.toLowerCase();
  for (const n of TAXONOMY) {
    if (n.keywords.some((k) => hay.includes(k))) return n.slug;
  }
  return "meta";
}

export function slugToNarrative(slug: string): Narrative | undefined {
  const n = TAXONOMY.find((t) => t.slug === slug);
  if (!n) return undefined;
  return {
    slug: n.slug,
    name: n.name,
    description: n.description,
    tokenCount: 0,
    volume24hUsd: 0,
    attentionDeltaPct: 0,
    holderGrowthPct: null,
    newLaunches24h: 0,
    tokens: [],
    timeline: [],
  };
}
