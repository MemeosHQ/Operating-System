import { clamp } from "@/lib/utils";
import type { DnaDimension, DnaProfile, TokenMetrics } from "@/lib/types";

/**
 * MEME DNA (deterministic, documented)
 *
 * Eight dimensions scored 0–100 from observable token data. Every score
 * carries its calculation basis so the UI can show WHY a score exists.
 * Where required data is missing (e.g. holders unknown), the dimension is
 * scored against the observable proxy and flagged in `basis`.
 */

const W = {
  liquidityFloorUsd: 5_000,
  liquidityCeilUsd: 500_000,
  holderFloor: 50,
  holderCeil: 5_000,
  holderConcentrationRisk: 0.6,
  mcFloorUsd: 20_000,
  mcCeilUsd: 2_000_000,
  notableFloor: 2,
} as const;

/** 0 at floor → 100 at ceiling, log scale between. */
function logBand(value: number, floor: number, ceil: number) {
  if (value <= 0) return 0;
  const f = Math.log10(Math.max(floor, 1));
  const c = Math.log10(ceil);
  const v = Math.log10(value);
  return clamp(Math.round(((v - f) / (c - f)) * 100), 0, 100);
}

export function computeDnaDimensions(
  t: TokenMetrics
): { dimensions: DnaDimension[]; missing: string[] } {
  const missing: string[] = [];
  const dims: DnaDimension[] = [];

  const push = (
    key: DnaDimension["key"],
    label: string,
    score: number,
    basis: string
  ) => dims.push({ key, label, score: clamp(Math.round(score), 0, 100), basis });

  // ── Attention ───────────────────────────────────────────────
  const attention = t.attentionVelocity ?? 0;
  push(
    "attention",
    "Attention",
    attention,
    `Calculated: attention velocity ${attention}/100 (volume + txn rate vs. baseline)`
  );

  // ── Holder quality ──────────────────────────────────────────
  if (t.holders && t.holders > 0) {
    const hq = logBand(t.holders, W.holderFloor, W.holderCeil);
    push(
      "holderQuality",
      "Holder Quality",
      hq,
      `Observed: ${t.holders} holders mapped on log scale (${W.holderFloor}–${W.holderCeil})`
    );
  } else {
    missing.push("holders");
    const proxy = logBand(t.marketCapUsd, W.mcFloorUsd, W.mcCeilUsd);
    push(
      "holderQuality",
      "Holder Quality",
      proxy,
      "Calculated proxy: holder data unavailable — market cap band used instead"
    );
  }

  // ── Liquidity ───────────────────────────────────────────────
  const liq = logBand(t.liquidityUsd, W.liquidityFloorUsd, W.liquidityCeilUsd);
  push(
    "liquidity",
    "Liquidity",
    liq,
    `Observed: $${Math.round(t.liquidityUsd).toLocaleString()} liquidity mapped on log scale`
  );

  // ── Smart money ─────────────────────────────────────────────
  const notable = t.notableWallets ?? 0;
  push(
    "smartMoney",
    "Smart Money",
    clamp((notable / W.notableFloor) * 55, 0, 100) * (notable > 0 ? 1 : 0.35),
    notable > 0
      ? `Observed: ${notable} notable wallet${notable === 1 ? "" : "s"} transacting`
      : "No notable wallet activity observed (low signal, not zero)"
  );

  // ── Community ───────────────────────────────────────────────
  const buyerShare =
    t.buys24h && t.txns24h && t.txns24h > 0 ? t.buys24h / t.txns24h : 0.5;
  const community = clamp(
    logBand(t.txns24h ?? t.marketCapUsd / 500, 100, 20_000) * 0.6 +
      buyerShare * 40,
    0,
    100
  );
  push(
    "community",
    "Community",
    community,
    `Calculated: txn breadth + buy pressure ${(buyerShare * 100).toFixed(0)}% of trades are buys`
  );

  // ── Creator activity ────────────────────────────────────────
  push(
    "creatorActivity",
    "Creator Activity",
    t.creatorAddress ? 62 : 30,
    t.creatorAddress
      ? "Observed: creator address published — see Creator profile"
      : "Creator address not published by upstream source"
  );

  // ── Bot activity (lower = cleaner) ──────────────────────────
  const sells = t.sells24h ?? 0;
  const sellShare = t.txns24h ? sells / t.txns24h : 0.5;
  const bot = clamp(100 - Math.abs(sellShare - 0.5) * 260, 10, 100);
  push(
    "botActivity",
    "Bot Activity",
    bot,
    `Calculated: buy/sell balance ${(sellShare * 100).toFixed(
      0
    )}% sells — extreme imbalance is the observable bot proxy`
  );

  // ── Momentum ────────────────────────────────────────────────
  const momentum = clamp(50 + t.priceChange24hPct / 2, 0, 100);
  push(
    "momentum",
    "Momentum",
    momentum,
    `Observed: price ${t.priceChange24hPct >= 0 ? "+" : ""}${t.priceChange24hPct.toFixed(
      1
    )}% over 24h`
  );

  return { dimensions: dims, missing };
}

export function buildDnaProfile(
  t: TokenMetrics,
  evolution: DnaProfile["evolution"] = [],
  availability: DnaProfile["availability"] = { unavailable: [] }
): DnaProfile {
  const { dimensions, missing } = computeDnaDimensions(t);
  const evidence = dimensions.map((d) => ({
    kind: "calculated" as const,
    label: d.label,
    value: `${d.score}/100 — ${d.basis}`,
  }));
  return {
    address: t.address,
    token: t,
    dimensions,
    evidence,
    evolution,
    availability: missing.length
      ? {
          unavailable: [
            ...availability.unavailable,
            ...missing.map((m) => ({
              capability: m === "holders" ? "Holder analytics" : m,
              reason:
                "Requires a holder-data provider (set BIRDEYE_API_KEY or HELIUS_API_KEY for live data).",
              requiredEnv: ["BIRDEYE_API_KEY"],
            })),
          ],
        }
      : availability,
  };
}
