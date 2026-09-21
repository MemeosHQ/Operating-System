import "server-only";
import { prisma } from "@/lib/server/db";
import { dbEnabled } from "@/lib/server/pipeline";

/** Historical reads + DNA snapshot persistence + server-side watchlist. */

function liveMode(): "LIVE" | "DEMO" {
  const flag = process.env.MEMEOS_DEMO_MODE?.trim().toLowerCase();
  return flag === "true" ? "DEMO" : "LIVE";
}

export async function readAttentionHistory(address: string, limit = 50) {
  if (!dbEnabled()) return null;
  const rows = await prisma.attentionSnapshot.findMany({
    where: { tokenAddress: address },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    capturedAt: r.capturedAt.toISOString(),
    attentionVelocity: r.attentionVelocity,
    velocityMultiplier: r.velocityMultiplier,
    volumeDeltaPct: r.volumeDeltaPct,
    buyerDeltaPct: r.buyerDeltaPct,
    state: r.state,
    calcVersion: r.calcVersion,
  }));
}

export async function readDnaHistory(address: string, limit = 30) {
  if (!dbEnabled()) return null;
  const rows = await prisma.dnaSnapshot.findMany({
    where: { tokenAddress: address },
    orderBy: { capturedAt: "desc" },
    take: limit * 8,
  });
  const byTime = new Map<string, { capturedAt: string; dimensions: { dimension: string; score: number; isProxy: boolean }[] }>();
  for (const r of rows) {
    const key = r.capturedAt.toISOString();
    if (!byTime.has(key)) byTime.set(key, { capturedAt: key, dimensions: [] });
    byTime.get(key)!.dimensions.push({ dimension: r.dimension, score: r.score, isProxy: r.isProxy });
  }
  return [...byTime.values()].slice(0, limit);
}

export async function writeDnaSnapshots(
  address: string,
  dims: { key: string; label: string; score: number; basis: string }[]
): Promise<void> {
  if (!dbEnabled() || dims.length === 0) return;
  const m = liveMode();
  for (const d of dims) {
    await prisma.dnaSnapshot.create({
      data: {
        tokenAddress: address,
        dimension: d.key,
        score: d.score,
        basis: d.basis,
        isProxy: /proxy/i.test(d.basis),
        sourceMode: m,
      },
    });
  }
}

export async function readNarrativeHistory(slug: string, limit = 30) {
  if (!dbEnabled()) return null;
  const rows = await prisma.narrativeSnapshot.findMany({
    where: { slug },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    capturedAt: r.capturedAt.toISOString(),
    tokenCount: r.tokenCount,
    volume24hUsd: r.volume24hUsd,
    txns24h: r.txns24h,
    activeWallets: r.activeWallets,
    attentionDeltaPct: r.attentionDeltaPct,
    newLaunches24h: r.newLaunches24h,
    calcVersion: r.calcVersion,
  }));
}

/** Raw snapshot rows (most recent first) for the momentum window comparison. */
export async function readNarrativeSnapshotRows(slug: string, sinceMs: number) {
  if (!dbEnabled()) return null;
  const rows = await prisma.narrativeSnapshot.findMany({
    where: { slug, capturedAt: { gte: new Date(Date.now() - sinceMs) } },
    orderBy: { capturedAt: "desc" },
    take: 40,
  });
  return rows.map((r) => ({
    volume24hUsd: r.volume24hUsd,
    txns24h: r.txns24h,
    activeWallets: r.activeWallets,
    attentionDeltaPct: r.attentionDeltaPct,
    newLaunches24h: r.newLaunches24h,
    tokenCount: r.tokenCount,
    capturedAtMs: Date.now() - (Date.now() - r.capturedAt.getTime()),
  }));
}

export async function readTokenSnapshots(address: string, limit = 50) {
  if (!dbEnabled()) return null;
  const token = await prisma.token.findUnique({ where: { address } });
  if (!token) return [];
  const rows = await prisma.tokenSnapshot.findMany({
    where: { tokenId: token.id },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    capturedAt: r.capturedAt.toISOString(),
    priceUsd: r.priceUsd,
    marketCapUsd: r.marketCapUsd,
    liquidityUsd: r.liquidityUsd,
    volume24hUsd: r.volume24hUsd,
    holders: r.holders,
    holdersIsProxy: r.holdersIsProxy,
  }));
}

/** Server-side watchlist CRUD (keyed by connected wallet address). */
export async function watchlistItems(walletAddress: string) {
  if (!dbEnabled()) return null;
  const rows = await prisma.watchlist.findMany({
    where: { walletAddress },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ kind: r.kind, id: r.itemId, label: r.label, addedAt: r.createdAt.getTime() }));
}

export async function watchlistAdd(
  walletAddress: string,
  item: { kind: string; id: string; label: string }
): Promise<boolean> {
  if (!dbEnabled()) return false;
  await prisma.watchlist.upsert({
    where: { walletAddress_kind_itemId: { walletAddress, kind: item.kind, itemId: item.id } },
    create: { walletAddress, kind: item.kind, itemId: item.id, label: item.label },
    update: { label: item.label },
  });
  return true;
}

export async function watchlistRemove(walletAddress: string, kind: string, itemId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  await prisma.watchlist.deleteMany({ where: { walletAddress, kind, itemId } });
  return true;
}
