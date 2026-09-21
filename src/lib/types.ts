/** MEMEOS domain types. Shared by providers, engines, API routes and UI. */

/** A Solana token as surfaced across the product. */
export interface TokenMetrics {
  address: string;
  name: string;
  ticker: string;
  logoUrl?: string;
  /** Ordered fallback candidates (Helius → DexScreener → …) — normalized URLs. */
  logoUrls?: string[];
  marketCapUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  priceUsd: number;
  priceChange24hPct: number;
  /** Minutes since creation (bounded below by 1 for fresh tokens). */
  ageMinutes: number;
  holders?: number;
  txns24h?: number;
  buys24h?: number;
  sells24h?: number;
  narrativeTag: string;
  status: TokenStatus;
  creatorAddress?: string;
  /** Number of notable (high-conviction) wallets observed transacting. */
  notableWallets?: number;
  /** 0–100 calculated attention velocity (see lib/metrics/attention.ts). */
  attentionVelocity?: number;
  /** Voluntary, source-labeled human narrative if provided by upstream. */
  description?: string;
}

export type TokenStatus = "new" | "bonding" | "graduated";

export type LifecycleStage =
  | "embryonic"
  | "ignition"
  | "expansion"
  | "stall"
  | "decay"
  | "graduated";

/** Attention classification used by the Attention engine. */
export type AttentionState = "exploding" | "accelerating" | "cooling" | "flat";

export interface AttentionClassification extends AttentionStateInfo {
  address: string;
  token: TokenMetrics;
}

export interface AttentionStateInfo {
  state: AttentionState;
  /** e.g. 4.2 → attention running 4.2× its baseline. */
  velocityMultiplier: number;
  volumeDeltaPct: number;
  buyerDeltaPct: number;
  reason: string;
}

  /** A narrative theme (AI, cats, anime, …) with momentum across member tokens. */
export interface Narrative {
  slug: string;
  name: string;
  description: string;
  tokenCount: number;
  volume24hUsd: number;
  /** % change in aggregate attention vs. prior window (calculated). */
  attentionDeltaPct: number;
  /** % holder growth across member tokens (calculated; null when unknown). */
  holderGrowthPct: number | null;
  newLaunches24h: number;
  tokens: string[];
  timeline: { label: string; attention: number }[];
  /** When this snapshot was computed (server time, ISO) — real freshness. */
  generatedAt?: string;
  /** "database" = persisted real history · "modeled" = projection from the live value. */
  timelineSource?: "database" | "modeled";
  /** Momentum vs. a real previous window (null = still building a baseline). */
  momentumPct?: number | null;
  momentumStatus?:
    | "ACCELERATING"
    | "RISING"
    | "STEADY"
    | "COOLING"
    | "FADING"
    | "BUILDING_BASELINE";
  /** Observable notable-wallet proxies summed across member tokens (when available). */
  activeWallets?: number | null;
}

/** Minimal previous-snapshot shape the momentum engine compares against. */
export interface NarrativeSnapshotLike {
  volume24hUsd: number;
  txns24h: number | null;
  attentionDeltaPct: number;
  newLaunches24h: number;
  tokenCount: number;
  capturedAtMs: number;
}

/** Canonical payload of /api/attention — token states + SHARED narrative state. */
export interface AttentionPayload {
  tokens: AttentionClassification[];
  narratives: Narrative[];
  generatedAt: string;
}


/** A Pump.fun-style launch event. */
export interface Launch {
  address: string;
  name: string;
  ticker: string;
  creatorAddress?: string;
  createdAtMs: number;
  marketCapUsd: number;
  status: TokenStatus;
  narrativeTag: string;
  /** Replay events when available (DEMO mode or indexed data). */
  events?: LaunchEvent[];
}

export interface LaunchEvent {
  /** Seconds from launch. */
  tSeconds: number;
  kind:
    | "launch"
    | "buyers"
    | "whale"
    | "volume"
    | "holders"
    | "smart-wallet"
    | "snapshot"
    | "graduation"
    | "activity";
  label: string;
  detail?: string;
}

/** Meme DNA — an 8-dimension evidence-backed profile of a token. */
export interface DnaProfile {
  address: string;
  token: TokenMetrics;
  /** Each dimension 0–100 with its calculation basis. */
  dimensions: DnaDimension[];
  evidence: Evidence[];
  /** How the profile evolved over time (DEMO/replay data or snapshots). */
  evolution: DnaEvolutionPoint[];
  availability: DataAvailability;
}

export interface DnaDimension {
  key:
    | "attention"
    | "holderQuality"
    | "liquidity"
    | "smartMoney"
    | "community"
    | "creatorActivity"
    | "botActivity"
    | "momentum";
  label: string;
  score: number; // 0–100
  basis: string; // human-readable calculation basis
}

export interface DnaEvolutionPoint {
  label: string;
  scores: Record<string, number>;
}

export type EvidenceKind = "observed" | "calculated" | "ai-interpretation";

export interface Evidence {
  kind: EvidenceKind;
  label: string;
  value: string;
}

export interface DataAvailability {
  /** Which capabilities are unavailable and why (missing env, upstream down). */
  unavailable: { capability: string; reason: string; requiredEnv?: string[] }[];
}

/** Observable wallet intelligence. */
export interface WalletProfile {
  address: string;
  solBalance?: number;
  labels: WalletLabel[];
  walletAgeDays?: number;
  tokenCount?: number;
  solanaFmUrl: string;
  recentTrades: WalletTrade[];
  launchParticipation: number;
  earlyEntries: number;
  notableInteractions: string[];
  clusters?: string[];
  availability: DataAvailability;
}

export type WalletLabel =
  | "EARLY ENTRY"
  | "HIGH ACTIVITY"
  | "LAUNCH PARTICIPANT"
  | "SNIPER-STYLE"
  | "LONG HOLD"
  | "DORMANT"
  | "UNKNOWN";

export interface WalletTrade {
  tokenAddress: string;
  tokenTicker: string;
  side: "buy" | "sell";
  amountUsd: number;
  atMs: number;
}

export interface CreatorProfile {
  address: string;
  launchCount: number;
  successfulLaunches: number;
  avgPeakMarketCapUsd: number;
  medianLifespanMinutes: number;
  launchFrequencyPerWeek: number;
  recurringNarratives: string[];
  tokens: TokenMetrics[];
  firstLaunchMs?: number;
}

/** An AI/trading agent detected via observable on-chain behavior. */
export interface AgentProfile {
  address: string;
  name?: string;
  activity: "HIGH" | "MEDIUM" | "LOW";
  behavior: string;
  interactionCount: number;
  launchesInvolved: number;
  tokensTouched: string[];
  lastActiveMs?: number;
}

export interface HealthReport {
  rpc: "connected" | "degraded" | "down";
  data: "live" | "demo";
  pumpfun: "connected" | "down" | "unconfigured";
  dexscreener: "connected" | "down" | "unconfigured";
  /** Helius probe — "unconfigured" when HELIUS_API_KEY is not set. */
  helius?: "connected" | "down" | "unconfigured";
  /** AI provider — rule engine is always "connected"; LLM reported when configured. */
  ai?: "connected" | "down" | "unconfigured";
  /** Real LLM state: probed Gemini, degraded after failure, or unconfigured. */
  llm?: LlmStatus;
  /** Active LLM model name (public info — safe to display). */
  llmModel?: string;
  /** Database — "unconfigured" without DATABASE_URL. */
  database?: "connected" | "down" | "unconfigured";
  /** Seconds since the last successful upstream market fetch; -1 when never fetched. */
  lastUpdateSeconds: number;
  checksAt: number;
}

export interface SearchResults {
  tokens: TokenMetrics[];
  wallets: { address: string }[];
  narratives: Narrative[];
  creators: { address: string; tokens: TokenMetrics[] }[];
}

export interface AnalystAnswer {
  text: string;
  sections: Evidence[];
  chips: string[];
  provider: "rule-engine" | string;
  /** "gemini" when a real LLM generated the answer — never claimed falsely. */
  engine?: "gemini" | "rule-engine";
  /** True when Gemini was configured but failed and the rule engine answered. */
  degraded?: boolean;
  /** Server time of the underlying MEMEOS data snapshot. */
  dataTimestamp?: string;
  sourceMode?: "live" | "demo";
  /** Which MEMEOS data sources fed the answer. */
  dataSources?: string[];
}

/** Gemini LLM status for the health report (rule engine always available). */
export type LlmStatus = "gemini-live" | "degraded" | "unconfigured";

