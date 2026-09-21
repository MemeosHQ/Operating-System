import "server-only";
import { classifyToken } from "@/lib/metrics/attention";
import { buildDnaProfile } from "@/lib/metrics/dna";
import {
  narrativeAttentionDeltaPct,
  narrativeHolderGrowthPct,
  narrativeTimeline,
  narrativeVolumeUsd,
  TAXONOMY,
} from "@/lib/metrics/narrative";
import { answerQuestion } from "@/lib/ai/analyst";
import { DataUnavailableError } from "@/lib/errors";
import { isSolanaAddress } from "@/lib/utils";
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
import { fetchSolanaMemeSnapshot, fetchTokenPair } from "./dexscreener";
import { fetchPumpLaunches } from "./pumpfun";
import { fetchHolderCount } from "./birdeye";
import { rpcHealthy, getSolBalance } from "./rpc";
import {
  getFirst60sEvents,
  getWalletTransactions,
  getTokenMetadata,
  getBatchTokenMetadata,
  heliusHealthy,
} from "./helius";
import { probeDexscreener, probePumpfun } from "@/lib/server/probes";
import { heliusConfigured } from "@/lib/server/env";
import { buildImageCandidates } from "@/lib/image-url";

/**
 * LIVE PROVIDER — real Solana ecosystem data.
 * - Tokens/market: DexScreener (public, keyless)
 * - Launches: Pump.fun public API (keyless)
 * - Holders: Birdeye (optional, BIRDEYE_API_KEY)
 * - Health: Solana RPC
 * Capabilities that need indexing infrastructure (launch replay, agent
 * detection, full wallet graph) fail HONESTLY with DataUnavailableError.
 */
export class LiveProvider implements MemeosProviders {
  readonly mode = "live" as const;
  readonly providerName = "rule-engine";

  async getTokens(): Promise<TokenMetrics[]> {
    const [market, launches] = await Promise.all([
      fetchSolanaMemeSnapshot(),
      fetchPumpLaunches(20).catch(() => [] as Launch[]),
    ]);
    const launchTokens: TokenMetrics[] = launches.map((l) => ({
      address: l.address,
      name: l.name,
      ticker: l.ticker,
      marketCapUsd: l.marketCapUsd,
      liquidityUsd: 0,
      volume24hUsd: 0,
      priceUsd: 0,
      priceChange24hPct: 0,
      ageMinutes: Math.max(1, (Date.now() - l.createdAtMs) / 60_000),
      narrativeTag: l.narrativeTag,
      status: "new",
      creatorAddress: l.creatorAddress,
    }));
    const byAddress = new Map(market.map((t) => [t.address, t]));
    for (const l of launchTokens) if (!byAddress.has(l.address)) byAddress.set(l.address, l);
    const tokens = [...byAddress.values()];

    // Batch logo enrichment — Helius DAS getAssetBatch for the whole list
    // (one RPC per ~100 tokens, cross-request cached; DexScreener image kept
    // as a fallback candidate). Never fabricates images.
    try {
      const missing = tokens.filter((t) => !t.logoUrl).map((t) => t.address);
      if (missing.length > 0) {
        const metas = await getBatchTokenMetadata(missing);
        if (process.env.NODE_ENV !== "production" && metas.size > 0) {
          const withImages = [...metas.values()].filter((m) => m.imageUri).length;
          console.debug(`[memeos:logos] DAS batch: ${metas.size} metas, ${withImages} with images`);
        }
        for (const t of tokens) {
          const meta = metas.get(t.address);
          const candidates = buildImageCandidates(meta?.imageUri, t.logoUrl);
          if (candidates.length > 0) {
            t.logoUrl = candidates[0];
            t.logoUrls = candidates;
          }
        }
      }
    } catch {
      /* enrichment is best-effort — the list still serves without logos */
    }
    return tokens;
  }

  async getToken(address: string): Promise<TokenMetrics> {
    if (!isSolanaAddress(address)) {
      throw new DataUnavailableError("That does not look like a valid Solana address.");
    }
    let t = await fetchTokenPair(address);
    // Enrich with on-chain metadata (Helius DAS) when DexScreener lacks it.
    if ((!t.logoUrl || t.ageMinutes <= 1) && heliusConfigured()) {
      const meta = await getTokenMetadata(address);
      if (meta) {
        const candidates = buildImageCandidates(meta.imageUri, t.logoUrl);
        t = {
          ...t,
          logoUrl: candidates[0] ?? t.logoUrl,
          logoUrls: candidates.length > 0 ? candidates : t.logoUrls,
          ageMinutes:
            t.ageMinutes <= 1 && meta.createdAtMs
              ? Math.max(1, (Date.now() - meta.createdAtMs) / 60_000)
              : t.ageMinutes,
        };
      }
    }
    return t;
  }

  async getDna(address: string): Promise<DnaProfile> {
    let t = await this.getToken(address);
    if (t.holders === undefined) {
      const holders = await fetchHolderCount(address).catch(() => undefined);
      if (holders !== undefined) t = { ...t, holders };
    }
    const unavailable: DnaProfile["availability"]["unavailable"] = [];
    if (t.holders === undefined) {
      unavailable.push({
        capability: "Holder analytics",
        reason: "Live holder data requires BIRDEYE_API_KEY. Scoring uses market-cap proxy.",
        requiredEnv: ["BIRDEYE_API_KEY"],
      });
    }
    unavailable.push({
      capability: "DNA evolution timeline",
      reason: "Historical snapshots require a persistent store (DATABASE_URL) or indexed history.",
      requiredEnv: ["DATABASE_URL"],
    });
    return buildDnaProfile(t, [], { unavailable });
  }

  classify(): Promise<AttentionClassification[]> {
    return this.getTokens().then((ts) => ts.map(classifyToken));
  }

  async getLaunches(): Promise<Launch[]> {
    return fetchPumpLaunches(20);
  }

  async getLaunchReplay(address: string): Promise<Launch> {
    if (!isSolanaAddress(address)) {
      throw new DataUnavailableError("That does not look like a valid Solana address.");
    }
    // Market context from DexScreener (cached), events from parsed on-chain
    // history via Helius Enhanced Transactions (first 60 seconds).
    const [base, events] = await Promise.all([
      fetchTokenPair(address).catch(
        () =>
          ({
            address,
            name: address.slice(0, 6),
            ticker: "??",
            marketCapUsd: 0,
            liquidityUsd: 0,
            volume24hUsd: 0,
            priceUsd: 0,
            priceChange24hPct: 0,
            ageMinutes: 1,
            narrativeTag: "meta",
            status: "new",
            creatorAddress: undefined,
          }) satisfies TokenMetrics
      ),
      getFirst60sEvents(address),
    ]);
    return {
      address,
      name: base.name,
      ticker: base.ticker,
      creatorAddress: base.creatorAddress,
      createdAtMs: Date.now() - 60_000,
      marketCapUsd: base.marketCapUsd,
      status: base.status,
      narrativeTag: base.narrativeTag,
      events: events.map((e) => ({
        tSeconds: Math.round(e.tSeconds),
        kind:
          e.kind === "launch"
            ? ("launch" as const)
            : e.kind === "whale"
              ? ("whale" as const)
              : e.kind === "snapshot"
                ? ("snapshot" as const)
                : "activity",
        label: e.label,
      })),
    };
  }

  async getWallet(address: string): Promise<WalletProfile> {
    if (!isSolanaAddress(address)) {
      throw new DataUnavailableError("That does not look like a valid Solana address.");
    }
    const solBalance = await getSolBalance(address);
    const unavailable: WalletProfile["availability"]["unavailable"] = [];
    if (solBalance === undefined) {
      unavailable.push({
        capability: "SOL balance",
        reason: "Solana RPC is unreachable or rate-limited right now.",
      });
    }

    // Real parsed trade history when Helius is configured.
    let recentTrades: WalletProfile["recentTrades"] = [];
    const txs = await getWalletTransactions(address).catch(() => undefined);
    if (txs) {
      const swaps = txs.filter((t) => t.kind === "buy" || t.kind === "sell");
      recentTrades = swaps.slice(0, 10).map((t) => ({
        tokenAddress: t.mint ?? "unknown",
        tokenTicker: t.mint ? `${t.mint.slice(0, 4)}…${t.mint.slice(-4)}` : "—",
        side: t.kind === "buy" ? ("buy" as const) : ("sell" as const),
        amountUsd: 0, // USD pricing per trade requires market lookup per mint — labeled unavailable
        atMs: t.timestamp * 1000,
      }));
      // Transparent, observable labels — never an unearned "smart money" verdict.
      const labels: WalletProfile["labels"] =
        swaps.length >= 10 ? ["HIGH ACTIVITY"] : swaps.length > 0 ? ["UNKNOWN"] : ["UNKNOWN"];

      return {
        address,
        solBalance,
        labels,
        solanaFmUrl: `https://solscan.io/account/${address}`,
        recentTrades,
        launchParticipation: new Set(txs.filter((t) => t.kind === "buy").map((t) => t.mint)).size,
        earlyEntries: 0, // requires launch creation timestamps (DATABASE_URL snapshot history)
        notableInteractions: [],
        availability: {
          unavailable: [
            ...unavailable,
            ...(recentTrades.length === 0
              ? [
                  {
                    capability: "Recent swaps",
                    reason: "No parsed swaps in the latest Helius window for this address.",
                  },
                ]
              : []),
            {
              capability: "Per-trade USD sizing",
              reason: "Requires a market lookup per traded mint (planned enrichment).",
            },
            {
              capability: "Full wallet graph & funding source",
              reason: "Requires indexed relationship history (DATABASE_URL).",
              requiredEnv: ["DATABASE_URL"],
            },
          ],
        },
      };
    }

    unavailable.push({
      capability: "Trade history & wallet graph",
      reason: "Full wallet intelligence requires Helius Enhanced Transactions.",
      requiredEnv: ["HELIUS_API_KEY"],
    });
    return {
      address,
      solBalance,
      labels: ["UNKNOWN"],
      solanaFmUrl: `https://solscan.io/account/${address}`,
      recentTrades: [],
      launchParticipation: 0,
      earlyEntries: 0,
      notableInteractions: [],
      availability: { unavailable },
    };
  }

  async getNarratives(): Promise<Narrative[]> {
    const tokens = await this.getTokens();
    return TAXONOMY.map((n) => {
      const member = tokens.filter((t) => t.narrativeTag === n.slug);
      return {
        slug: n.slug,
        name: n.name,
        description: n.description,
        tokenCount: member.length,
        volume24hUsd: narrativeVolumeUsd(member),
        attentionDeltaPct: narrativeAttentionDeltaPct(member),
        holderGrowthPct: narrativeHolderGrowthPct(member),
        newLaunches24h: member.filter((t) => t.ageMinutes < 60 * 24).length,
        tokens: member.map((t) => t.address),
        timeline: narrativeTimeline(n.slug, member),
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
    const launches = await this.getLaunches().catch(() => [] as Launch[]);
    const byCreator = new Map<string, Launch[]>();
    for (const l of launches) {
      if (!l.creatorAddress) continue;
      const list = byCreator.get(l.creatorAddress) ?? [];
      list.push(l);
      byCreator.set(l.creatorAddress, list);
    }
    return [...byCreator.entries()].map(([address, ls]) => ({
      address,
      launchCount: ls.length,
      successfulLaunches: ls.filter((l) => l.status === "graduated").length,
      avgPeakMarketCapUsd: Math.round(
        ls.reduce((a, l) => a + l.marketCapUsd, 0) / Math.max(1, ls.length)
      ),
      medianLifespanMinutes: 0,
      launchFrequencyPerWeek: 0,
      recurringNarratives: [...new Set(ls.map((l) => l.narrativeTag))],
      tokens: ls.map((l) => ({
        address: l.address,
        name: l.name,
        ticker: l.ticker,
        marketCapUsd: l.marketCapUsd,
        liquidityUsd: 0,
        volume24hUsd: 0,
        priceUsd: 0,
        priceChange24hPct: 0,
        ageMinutes: Math.max(1, (Date.now() - l.createdAtMs) / 60_000),
        narrativeTag: l.narrativeTag,
        status: l.status,
      })),
      firstLaunchMs: Math.min(...ls.map((l) => l.createdAtMs)),
    }));
  }

  async getCreator(address: string): Promise<CreatorProfile> {
    const all = await this.getCreators();
    const c = all.find((x) => x.address === address);
    if (!c) {
      throw new DataUnavailableError(
        "No recent launches from this creator in the current launch window."
      );
    }
    return c;
  }

  async getAgents(): Promise<AgentProfile[]> {
    throw new DataUnavailableError(
      "Agent detection requires indexed transaction streams (Helius webhooks + persistent store).",
      ["HELIUS_API_KEY", "DATABASE_URL"]
    );
  }

  async search(query: string): Promise<SearchResults> {
    const q = query.trim();
    const lower = q.toLowerCase();
    const tokens = isSolanaAddress(q)
      ? [await fetchTokenPair(q).catch(() => null)].filter(
          (t): t is TokenMetrics => t !== null
        )
      : (await this.getTokens().catch(() => [] as TokenMetrics[]))
          .filter(
            (t) =>
              t.name.toLowerCase().includes(lower) ||
              t.ticker.toLowerCase().includes(lower)
          )
          .slice(0, 8);
    const narratives = TAXONOMY.filter(
      (n) => n.name.toLowerCase().includes(lower) || n.slug.includes(lower)
    ).map((n) => ({
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
    }));
    return {
      tokens,
      wallets: isSolanaAddress(q) ? [{ address: q }] : [],
      narratives,
      creators: [],
    };
  }

  async health(): Promise<HealthReport> {
    const rpcOk = await rpcHealthy();
    const { upstreamAgeSeconds } = await import("@/lib/server/freshness");
    const lastUpdateSeconds = upstreamAgeSeconds() ?? -1;
    const probes = await Promise.all([
      probeDexscreener(),
      probePumpfun(),
      heliusHealthy(),
    ]);
    return {
      rpc: rpcOk ? "connected" : "degraded",
      data: "live",
      pumpfun: probes[1],
      dexscreener: probes[0],
      helius: heliusConfigured() ? (probes[2] ? "connected" : "down") : "unconfigured",
      ai: "connected", // the rule-engine Analyst needs no key and answers from in-app data
      lastUpdateSeconds,
      checksAt: Date.now(),
    };
  }

  async ask(question: string, context?: { tokenAddress?: string }): Promise<AnalystAnswer> {
    let token: TokenMetrics | undefined;
    if (context?.tokenAddress) {
      token = await this.getToken(context.tokenAddress).catch(() => undefined);
    }
    const narratives = /narrative|accelerat|trend/.test(question.toLowerCase())
      ? await this.getNarratives().catch(() => undefined)
      : undefined;
    return answerQuestion(question, { token, narratives });
  }
}
