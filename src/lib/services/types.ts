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

/**
 * MEMEOS data provider abstraction.
 *
 * The UI talks ONLY to these interfaces. Implementations:
 *   - demo/provider.ts  → deterministic sample data (DEMO mode)
 *   - live/provider.ts  → DexScreener + Pump.fun + Solana RPC + optional
 *                         Helius/Birdeye (LIVE mode)
 *
 * Swapping or adding providers must never require UI changes.
 */

export interface TokenDataProvider {
  readonly mode: "demo" | "live";
  getTokens(): Promise<TokenMetrics[]>;
  getToken(address: string): Promise<TokenMetrics>;
  getDna(address: string): Promise<DnaProfile>;
  classify(): Promise<AttentionClassification[]>;
}

export interface LaunchDataProvider {
  getLaunches(): Promise<Launch[]>;
  getLaunchReplay(address: string): Promise<Launch>;
}

export interface WalletDataProvider {
  getWallet(address: string): Promise<WalletProfile>;
}

export interface NarrativeDataProvider {
  getNarratives(): Promise<Narrative[]>;
  getNarrative(slug: string): Promise<Narrative>;
}

export interface CreatorDataProvider {
  getCreators(): Promise<CreatorProfile[]>;
  getCreator(address: string): Promise<CreatorProfile>;
}

export interface AgentDataProvider {
  getAgents(): Promise<AgentProfile[]>;
}

export interface SearchProvider {
  search(query: string): Promise<SearchResults>;
}

export interface HealthProvider {
  health(): Promise<HealthReport>;
}

export interface AIProvider {
  readonly providerName: string;
  ask(question: string, context?: { tokenAddress?: string }): Promise<AnalystAnswer>;
}

/** Aggregate facade the API routes consume. */
export interface MemeosProviders
  extends TokenDataProvider,
    LaunchDataProvider,
    WalletDataProvider,
    NarrativeDataProvider,
    CreatorDataProvider,
    AgentDataProvider,
    SearchProvider,
    HealthProvider,
    AIProvider {}
