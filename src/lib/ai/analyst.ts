import type {
  AnalystAnswer,
  AttentionStateInfo,
  DnaProfile,
  Evidence,
  Narrative,
  TokenMetrics,
} from "@/lib/types";
import { fmtPct, fmtUsd } from "@/lib/utils";

/**
 * MEMEOS ANALYST — deterministic rule engine.
 * Answers STRICTLY from in-app data; labels statements OBSERVED / CALCULATED /
 * AI INTERPRETATION. Never invents on-chain activity. An LLM provider
 * (Gemini/OpenAI/Anthropic) can replace this while keeping the same contract.
 */

export interface AnalystContext {
  token?: TokenMetrics;
  attention?: AttentionStateInfo;
  dna?: DnaProfile;
  narratives?: Narrative[];
}

const o = (label: string, value: string): Evidence => ({ kind: "observed", label, value });
const c = (label: string, value: string): Evidence => ({ kind: "calculated", label, value });
const i = (value: string): Evidence => ({ kind: "ai-interpretation", label: "Interpretation", value });

export function answerQuestion(question: string, ctx: AnalystContext): AnalystAnswer {
  const q = question.toLowerCase();
  const t = ctx.token;

  if (t) {
    if (/why.*(gain|attention|pump|trend)/.test(q)) {
      const a = ctx.attention;
      const buyPct = t.buys24h && t.txns24h ? Math.round((t.buys24h / t.txns24h) * 100) : null;
      return {
        text: `Why is ${t.ticker} gaining attention — evidence:`,
        sections: [
          o("Volume (24h)", fmtUsd(t.volume24hUsd)),
          o("Transactions (24h)", `${t.txns24h ?? "?"}`),
          c("Attention velocity", `${t.attentionVelocity ?? "?"}/100 (${(a?.velocityMultiplier ?? 1).toFixed(1)}× baseline)`),
          c("Buy pressure", buyPct !== null ? `${buyPct}% of trades are buys` : "trade split unavailable"),
          i(a?.reason ?? "Activity is elevated relative to the token's own baseline."),
        ],
        chips: ["Who were the earliest notable buyers?", "What changed in the last 10 minutes?"],
        provider: "rule-engine",
      };
    }
    if (/(earliest|notable buyer|smart money|wallet)/.test(q)) {
      const n = t.notableWallets ?? 0;
      return {
        text: `Wallet intelligence for ${t.ticker}:`,
        sections: [
          o("Notable wallets observed", `${n} notable wallet(s) transacted`),
          c("Smart-money DNA", `${ctx.dna?.dimensions.find((d) => d.key === "smartMoney")?.score ?? "?"}/100`),
          i(n > 0
            ? "Notable-wallet overlap suggests informed participation — small sample, never a guarantee."
            : "No notable-wallet activity observed. Absence of signal is not absence of smart money."),
        ],
        chips: ["Compare launch with historical launches"],
        provider: "rule-engine",
      };
    }
    if (/(dna|holder|liquidity|score)/.test(q) && ctx.dna) {
      const ranked = [...ctx.dna.dimensions].sort((a, b) => b.score - a.score);
      return {
        text: `Meme DNA for ${t.ticker}:`,
        sections: [
          ...ranked.slice(0, 3).map((d) => c(d.label, `${d.score}/100 — ${d.basis}`)),
          i(`Strongest: ${ranked[0].label} (${ranked[0].score}). Weakest: ${ranked[ranked.length - 1].label} (${ranked[ranked.length - 1].score}).`),
        ],
        chips: ["Why is this token gaining attention?"],
        provider: "rule-engine",
      };
    }
    // Generic token answer
    return {
      text: `${t.ticker} — current picture:`,
      sections: [
        o("Market cap", fmtUsd(t.marketCapUsd)),
        o("Liquidity", fmtUsd(t.liquidityUsd)),
        o("Volume (24h)", fmtUsd(t.volume24hUsd)),
        o("Price change (24h)", fmtPct(t.priceChange24hPct, 1)),
        c("Attention velocity", `${t.attentionVelocity ?? "?"}/100`),
        i("Model reading of observed data — not a prediction. DYOR."),
      ],
      chips: ["Why is this token gaining attention?", "Show me the Meme DNA"],
      provider: "rule-engine",
    };
  }

  if (/narrative|accelerat|trend/.test(q) && ctx.narratives?.length) {
    // Canonical momentum fields — never a second calculation here.
    const ranked = [...ctx.narratives].sort(
      (a, b) => (b.momentumPct ?? -999) - (a.momentumPct ?? -999)
    );
    const building = ranked.filter((n) => n.momentumPct === null || n.momentumPct === undefined);
    return {
      text: "Narrative momentum right now (canonical engine, vs. previous 5–20 min window):",
      sections: [
        ...ranked
          .filter((n) => n.momentumPct !== null && n.momentumPct !== undefined)
          .slice(0, 3)
          .map((n) => c(n.name, `${fmtPct(n.momentumPct!)} momentum · ${n.momentumStatus} · ${n.tokenCount} tokens · ${fmtUsd(n.volume24hUsd)} volume`)),
        ...building.slice(0, 2).map((n) => o(n.name, "BUILDING BASELINE — not enough prior observations yet")),
        i(
          ranked[0].momentumPct !== null && ranked[0].momentumPct !== undefined
            ? `${ranked[0].name} is accelerating fastest on real momentum vs. its previous observed snapshot.`
            : "Momentum baselines are still building — rankings appear once a previous window exists."
        ),
      ],
      chips: ["Which narratives are building a baseline?", "What changed in the last 10 minutes?"],
      provider: "rule-engine",
    };
  }

  return {
    text: "I answer questions about data inside MEMEOS — tokens, Meme DNA, attention, wallets, launches, narratives. Try:",
    sections: [
      o("Example", "Why is this token gaining attention?"),
      o("Example", "What narrative is accelerating?"),
    ],
    chips: ["What narrative is accelerating?"],
    provider: "rule-engine",
  };
}
