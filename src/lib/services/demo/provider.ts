import { classifyToken } from "@/lib/metrics/attention";
import { buildDnaProfile } from "@/lib/metrics/dna";
import {
  narrativeAttentionDeltaPct,
  narrativeHolderGrowthPct,
  narrativeTimeline,
  narrativeVolumeUsd,
  slugToNarrative,
  TAXONOMY,
} from "@/lib/metrics/narrative";
import { answerQuestion } from "@/lib/ai/analyst";
import type {
  AgentProfile,
  AnalystAnswer,
  AttentionClassification,
  CreatorProfile,
  DnaProfile,
  HealthReport,
  Launch,
  Narrative,
  SearchResults,
  TokenMetrics,
  WalletProfile,
} from "@/lib/types";
import type { MemeosProviders } from "@/lib/services/types";
import { DataUnavailableError } from "@/lib/errors";
import { isSolanaAddress } from "@/lib/utils";
import { demoTokens, demoTokenByAddress, demoTokensByNarrative } from "./data";
import { demoLaunches, demoWallet, demoWallets } from "./derived";
import { demoAgents, demoCreator, demoCreators } from "./people";

/**
 * DEMO PROVIDER — deterministic sample data for the entire UI.
 * Payloads flow through the same engines as live data (attention, DNA,
 * narrative momentum), so calculated layers are exercised for real.
 */
export class DemoProvider implements MemeosProviders {
  readonly mode = "demo" as const;
  readonly providerName = "rule-engine";

  async getTokens(): Promise<TokenMetrics[]> {
    return demoTokens;
  }

  async getToken(address: string): Promise<TokenMetrics> {
    const t = demoTokenByAddress(address);
    if (!t) {
      throw new DataUnavailableError(
        "Token not found in the demo dataset. In LIVE mode any on-chain mint can be resolved."
      );
    }
    return t;
  }

  async getDna(address: string): Promise<DnaProfile> {
    const t = await this.getToken(address);
    const evolution = [15, 30, 45, 60].map((m, i) => {
      const decay = 1 - (3 - i) * 0.18;
      const scores = Object.fromEntries(
        buildDnaProfile(t).dimensions.map((d) => [
          d.key,
          Math.max(4, Math.min(100, Math.round(d.score * decay + (i === 3 ? 0 : 6)))),
        ])
      );
      return { label: m === 60 ? "60m" : `${m}m`, scores };
    });
    return buildDnaProfile(t, evolution);
  }

  async classify(): Promise<AttentionClassification[]> {
    return demoTokens.map(classifyToken);
  }

  async getLaunches(): Promise<Launch[]> {
    return demoLaunches();
  }

  async getLaunchReplay(address: string): Promise<Launch> {
    const l = demoLaunches().find((x) => x.address === address);
    if (!l) {
      throw new DataUnavailableError(
        "No replay data for this launch. First-60-second streams require indexed launch data in LIVE mode.",
        ["HELIUS_API_KEY"]
      );
    }
    return l;
  }

  async getWallet(address: string): Promise<WalletProfile> {
    const w = demoWallet(address);
    if (w) return w;
    if (!isSolanaAddress(address)) {
      throw new DataUnavailableError("That does not look like a valid Solana address.");
    }
    throw new DataUnavailableError(
      "Wallet not present in the demo dataset. In LIVE mode, wallet intelligence resolves any address with HELIUS_API_KEY configured.",
      ["HELIUS_API_KEY"]
    );
  }

  async getNarratives(): Promise<Narrative[]> {
    return TAXONOMY.map((n) => {
      const tokens = demoTokensByNarrative(n.slug);
      const base = slugToNarrative(n.slug)!;
      return {
        ...base,
        tokenCount: tokens.length,
        volume24hUsd: narrativeVolumeUsd(tokens),
        attentionDeltaPct: narrativeAttentionDeltaPct(tokens),
        holderGrowthPct: narrativeHolderGrowthPct(tokens),
        newLaunches24h: tokens.filter((t) => t.ageMinutes < 60 * 24).length,
        tokens: tokens.map((t) => t.address),
        timeline: narrativeTimeline(n.slug, tokens),
      };
    }).sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct);
  }

  async getNarrative(slug: string): Promise<Narrative> {
    const all = await this.getNarratives();
    const n = all.find((x) => x.slug === slug);
    if (!n) throw new DataUnavailableError(`Narrative "${slug}" not found.`);
    return n;
  }

  async getCreators(): Promise<CreatorProfile[]> {
    return demoCreators();
  }

  async getCreator(address: string): Promise<CreatorProfile> {
    const c = demoCreator(address);
    if (!c) {
      throw new DataUnavailableError(
        "Creator not present in the demo dataset. In LIVE mode, creator profiles resolve from on-chain launch history.",
        ["HELIUS_API_KEY"]
      );
    }
    return c;
  }

  async getAgents(): Promise<AgentProfile[]> {
    return demoAgents();
  }

  async search(query: string): Promise<SearchResults> {
    const q = query.trim().toLowerCase();
    if (!q) return { tokens: [], wallets: [], narratives: [], creators: [] };
    const tokens = demoTokens
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.ticker.toLowerCase().includes(q) ||
          t.address.toLowerCase() === q
      )
      .slice(0, 8);
    const wallets = demoWallets()
      .filter((w) => w.address.toLowerCase().includes(q))
      .slice(0, 4)
      .map((w) => ({ address: w.address }));
    const narratives = TAXONOMY.filter(
      (n) => n.name.toLowerCase().includes(q) || n.slug.includes(q)
    ).map((n) => slugToNarrative(n.slug)!);
    const creators = demoCreators()
      .filter((c) => c.address.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({ address: c.address, tokens: c.tokens }));
    return { tokens, wallets, narratives, creators };
  }

  async health(): Promise<HealthReport> {
    return {
      rpc: "connected",
      data: "demo",
      pumpfun: "unconfigured",
      dexscreener: "unconfigured",
      lastUpdateSeconds: 2,
      checksAt: Date.now(),
    };
  }

  async ask(question: string, context?: { tokenAddress?: string }): Promise<AnalystAnswer> {
    const token = context?.tokenAddress ? demoTokenByAddress(context.tokenAddress) : undefined;
    const dna = token ? await this.getDna(token.address) : undefined;
    const narratives = /narrative|accelerat|trend/.test(question.toLowerCase())
      ? await this.getNarratives()
      : undefined;
    return answerQuestion(question, { token, dna, narratives });
  }
}
