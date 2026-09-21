import "server-only";
import { prisma } from "@/lib/server/db";
import { dbEnabled } from "@/lib/server/pipeline";

/**
 * Persisted-intelligence helpers: wallet activity persistence and the wallet
 * graph (observed evidence only). Demo and live rows never mix (sourceMode);
 * all operations are server-side.
 */

export interface PersistTrade {
  signature: string;
  mint?: string;
  solAmount?: number;
  tokenAmount?: number;
  timestamp: number;
  kind: string;
}

function liveMode(): "LIVE" | "DEMO" {
  const flag = process.env.MEMEOS_DEMO_MODE?.trim().toLowerCase();
  return flag === "true" ? "DEMO" : "LIVE";
}

/** Ensure a minimal Token row exists so activity/relationship FKs never fail. */
async function ensureTokenRow(address: string, m: "LIVE" | "DEMO") {
  await prisma.token
    .upsert({
      where: { address },
      create: {
        address,
        ticker: address.slice(0, 4),
        name: "Observed in wallet activity",
        narrativeTag: "meta",
        sourceMode: m,
        source: "observed-trade",
      },
      update: {},
    })
    .catch(() => undefined);
}

export async function persistWalletActivity(
  walletAddress: string,
  solBalance: number | undefined,
  trades: PersistTrade[]
): Promise<void> {
  if (!dbEnabled() || trades.length === 0) return;
  const m = liveMode();
  const wallet = await prisma.wallet.upsert({
    where: { address: walletAddress },
    create: { address: walletAddress, solBalance: solBalance ?? null, labels: [], sourceMode: m },
    update: { solBalance: solBalance ?? undefined, lastSeenAt: new Date() },
  });
  for (const t of trades) {
    if (t.mint) await ensureTokenRow(t.mint, m);
    await prisma.walletActivity.upsert({
      where: { walletId_signature: { walletId: wallet.id, signature: t.signature } },
      create: {
        walletId: wallet.id,
        tokenAddress: t.mint ?? null,
        signature: t.signature,
        action: t.kind,
        solAmount: t.solAmount ?? null,
        tokenAmount: t.tokenAmount ?? null,
        atMs: BigInt(Math.round(t.timestamp)),
        sourceMode: m,
      },
      update: { solAmount: t.solAmount ?? undefined, tokenAmount: t.tokenAmount ?? undefined },
    });
    if ((t.kind === "buy" || t.kind === "sell") && t.mint) {
      await ensureTokenRow(t.mint, m);
      await prisma.walletRelationship
        .upsert({
          where: {
            fromWalletId_toWalletId_tokenAddress_relType: {
              fromWalletId: wallet.id,
              toWalletId: "",
              tokenAddress: t.mint,
              relType: "wallet-token",
            },
          },
          create: {
            fromWalletId: wallet.id,
            toWalletId: null,
            tokenAddress: t.mint,
            relType: "wallet-token",
            evidence: `${t.kind} observed in ${t.signature.slice(0, 12)}…`,
            signature: t.signature,
            sourceMode: m,
          },
          update: { observedAt: new Date() },
        })
        .catch(() => undefined);
    }
  }
}

/** Observed wallet→token edges (evidence-backed; nothing speculative). */
export async function readWalletGraph(walletAddress: string) {
  if (!dbEnabled()) return null;
  const wallet = await prisma.wallet.findUnique({
    where: { address: walletAddress },
    select: { id: true },
  });
  if (!wallet) return { nodes: [], edges: [] };
  const rels = await prisma.walletRelationship.findMany({
    where: { fromWalletId: wallet.id },
    include: { token: { select: { address: true, ticker: true } } },
    take: 60,
    orderBy: { observedAt: "desc" },
  });
  return {
    nodes: [
      { id: walletAddress, kind: "wallet" as const },
      ...rels
        .filter((r) => r.token)
        .map((r) => ({ id: r.token!.address, kind: "token" as const, label: `$${r.token!.ticker}` })),
    ],
    edges: rels.map((r) => ({
      from: walletAddress,
      to: r.token?.address ?? r.tokenAddress ?? null,
      token: r.token?.ticker ?? r.tokenAddress ?? null,
      relType: r.relType,
      evidence: r.evidence,
      observedAt: r.observedAt.toISOString(),
    })),
  };
}

/**
 * Cautious agent detection from PERSISTED activity. A wallet is only flagged
 * when multiple objective signals agree; frequency alone is never enough.
 */
export async function detectAgents() {
  if (!dbEnabled()) return null;
  const wallets = await prisma.wallet.findMany({
    include: { activities: { orderBy: { atMs: "desc" }, take: 200 } },
    take: 200,
    orderBy: { lastSeenAt: "desc" },
  });

  for (const w of wallets) {
    const acts = w.activities;
    if (acts.length < 20) continue; // not enough observed behavior
    const evidence: string[] = [];
    let confidence = 0;

    if (acts.length >= 40) {
      evidence.push(`${acts.length} parsed actions in the observed window`);
      confidence += 0.25;
    }
    const times = acts.map((a) => Number(a.atMs)).sort((a, b) => a - b);
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    const fast = gaps.filter((g) => g < 20_000).length;
    if (gaps.length >= 10 && fast / gaps.length >= 0.6) {
      evidence.push(`${Math.round((fast / gaps.length) * 100)}% of trade gaps under 20s (automated-looking execution)`);
      confidence += 0.35;
    }
    const mintCounts = new Map<string, number>();
    for (const a of acts) if (a.tokenAddress) mintCounts.set(a.tokenAddress, (mintCounts.get(a.tokenAddress) ?? 0) + 1);
    const topMint = [...mintCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topMint && topMint[1] >= 15) {
      evidence.push(`${topMint[1]} actions on a single token (repeated program interaction pattern)`);
      confidence += 0.2;
    }
    const round = acts.filter((a) => a.solAmount && Math.abs(a.solAmount - Math.round(a.solAmount)) < 0.001).length;
    if (acts.length >= 30 && round / acts.length >= 0.7) {
      evidence.push(`${Math.round((round / acts.length) * 100)}% round-amount trades`);
      confidence += 0.1;
    }

    const label =
      confidence >= 0.6
        ? "POSSIBLE AGENT"
        : confidence >= 0.35
          ? "OBSERVED AUTOMATED-LIKE BEHAVIOR"
          : "UNKNOWN";

    if (evidence.length > 0) {
      await prisma.agentSignal.create({
        data: {
          walletId: w.id,
          signalType: "behavior-analysis",
          detail: evidence.join("; "),
          confidence,
        },
      });
      if (confidence >= 0.35) {
        await prisma.agent.upsert({
          where: { walletId: w.id },
          create: { walletId: w.id, label, confidence, evidence },
          update: { label, confidence, evidence, updatedAt: new Date() },
        });
      }
    }
  }

  const agents = await prisma.agent.findMany({
    include: { wallet: { include: { activities: { orderBy: { atMs: "desc" }, take: 100 } } } },
    take: 50,
    orderBy: { confidence: "desc" },
  });
  return agents.map((a) => {
    const acts = a.wallet.activities;
    const tokens = [...new Set(acts.map((x) => x.tokenAddress).filter((x): x is string => Boolean(x)))];
    return {
      address: a.wallet.address,
      activity: (acts.length >= 40 ? "HIGH" : acts.length >= 15 ? "MEDIUM" : "LOW") as
        | "HIGH"
        | "MEDIUM"
        | "LOW",
      behavior: `${a.label} — ${a.evidence.join("; ")} (calculated from persisted observed activity; not an identity claim)`,
      interactionCount: acts.length,
      launchesInvolved: 0,
      tokensTouched: tokens.slice(0, 10),
      lastActiveMs: acts[0] ? Number(acts[0].atMs) : undefined,
      confidence: a.confidence,
    };
  });
}
