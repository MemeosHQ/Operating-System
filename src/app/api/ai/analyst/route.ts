import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { sanitizePrompt } from "@/lib/validation";
import { getNarrativeIntelligence } from "@/lib/server/narrative-intelligence";
import { resolveQuestionEntities, assembleAiContext } from "@/lib/ai/context";
import { runAnalyst } from "@/lib/ai/engine";
import { rateLimit } from "@/lib/server/rate-limit";
import { resolveDataMode } from "@/lib/server/env";
import { isSolanaAddress } from "@/lib/utils";
import type { AnalystAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 8;

/**
 * MemeOS Analyst endpoint — validation → entity resolution → canonical data
 * context → Gemini (when configured) → rule-engine fallback. The response
 * always reports the real engine; the key never leaves the server.
 */
export async function POST(req: Request) {
  let body: {
    question?: string;
    tokenAddress?: string;
    history?: { role?: string; text?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON: { question, tokenAddress?, history? }" },
      { status: 400 }
    );
  }
  const question = sanitizePrompt(body.question ?? "");
  if (!question) {
    return NextResponse.json({ ok: false, error: "A question is required." }, { status: 400 });
  }
  const tokenAddress = body.tokenAddress?.trim() || undefined;
  if (tokenAddress && !isSolanaAddress(tokenAddress)) {
    return NextResponse.json({ ok: false, error: "Invalid token address." }, { status: 400 });
  }
  // Session memory: last few turns, sanitized and bounded.
  const history = (body.history ?? [])
    .slice(-HISTORY_LIMIT)
    .map((h) => ({
      role: h.role === "analyst" ? ("analyst" as const) : ("user" as const),
      text: sanitizePrompt(h.text ?? "", 400),
    }))
    .filter((h) => h.text);

  // Rate limiting per client (hashed key) — protects the Gemini quota.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (!rateLimit(`ai:${ip}`)) {
    return NextResponse.json(
      { ok: false, error: "Too many analyst requests — please wait a moment." },
      { status: 429 }
    );
  }

  return handleRoute("ai:analyst", async () => {
    const p = getProviders();
    const canonical = await getNarrativeIntelligence().catch(() => null);
    const tokens = canonical?.narratives.length ? await p.getTokens().catch(() => []) : [];
    const tokenAttention = canonical?.tokenAttention ?? [];
    const narratives = canonical?.narratives ?? [];

    const resolved = resolveQuestionEntities(question, tokens, narratives);
    const token = resolved.token ?? (tokenAddress ? tokens.find((t) => t.address === tokenAddress) : undefined);

    // Targeted enrichment only when the question touches that entity.
    const dna = token ? await p.getDna(token.address).catch(() => undefined) : undefined;
    const attention = token ? tokenAttention.find((a) => a.address === token.address) : undefined;
    const walletAddr = resolved.walletAddress;
    const wallet = walletAddr
      ? await p
          .getWallet(walletAddr)
          .then((w) => ({
            address: walletAddr,
            solBalance: w.solBalance,
            trades: w.recentTrades.slice(0, 20).map((t) => ({
              signature: `${t.tokenAddress.slice(0, 10)}-${t.atMs}`,
              action: t.side,
              token: t.tokenTicker,
              atMs: Number(t.atMs),
              solAmount: undefined,
            })),
          }))
          .catch(() => undefined)
      : undefined;
    const launch = token
      ? await p
          .getLaunchReplay(token.address)
          .then((l) => ({
            address: token.address,
            events: (l.events ?? []).map((e) => ({ atMs: Number(e.tSeconds) * 1000, label: e.label })),
          }))
          .catch(() => undefined)
      : undefined;

    const ctx = assembleAiContext(question, {
      tokens,
      narratives,
      tokenAttention,
      token,
      attention,
      dna,
      wallet,
      launch,
      sourceMode: resolveDataMode(),
      generatedAt: canonical?.generatedAt ?? new Date().toISOString(),
    });

    if (resolved.ambiguousTokens.length > 1 && !tokenAddress) {
      const answer: AnalystAnswer = {
        text: "That ticker matches more than one token — which one do you mean?",
        sections: resolved.ambiguousTokens.map((t) => ({
          kind: "observed" as const,
          label: t.ticker,
          value: `${t.name} · ${t.address.slice(0, 8)}…`,
        })),
        chips: [],
        provider: "rule-engine",
        engine: "rule-engine",
        sourceMode: resolveDataMode(),
      };
      return { ...answer, clarification: true, candidates: resolved.ambiguousTokens.slice(0, 4).map((t) => ({ address: t.address, ticker: t.ticker, name: t.name })) };
    }

    return runAnalyst({
      question,
      history,
      contextText: ctx.contextText,
      dataTimestamp: ctx.dataTimestamp,
      sourceMode: resolveDataMode(),
      dataSources: ctx.dataSources,
      ruleEngine: { token, attention, dna, narratives },
    });
  });
}
