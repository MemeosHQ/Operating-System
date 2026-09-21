import "server-only";
import { prisma } from "@/lib/server/db";
import { resolveDataMode, databaseConfigured } from "@/lib/server/env";
import { classifyToken } from "@/lib/metrics/attention";
import type { AttentionClassification, Launch, Narrative, TokenMetrics } from "@/lib/types";

/**
 * SERVER-SIDE persistence pipeline:
 * Helius + Pump.fun + DexScreener → MEMEOS normalization + calculations →
 * PostgreSQL → API → Terminal. The browser never orchestrates provider or
 * database operations.
 *
 * Snapshots run lazily behind a minimum-interval gate (no uncontrolled
 * setInterval anywhere) and can also be triggered explicitly via the
 * /api/jobs/snapshot job route (cron-friendly for production hosting).
 */

export const SNAPSHOT_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
export const CALC_VERSION = "v1";

export function dbEnabled(): boolean {
  return databaseConfigured();
}

function mode(): "LIVE" | "DEMO" {
  return resolveDataMode() === "live" ? "LIVE" : "DEMO";
}

async function lastSnapshotAt(): Promise<Date | null> {
  const row = await prisma.tokenSnapshot.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });
  return row?.capturedAt ?? null;
}

/** Persist the current token universe + attention snapshots if stale enough. */
export async function ensureTokenSnapshots(tokens: TokenMetrics[]): Promise<boolean> {
  if (!dbEnabled() || tokens.length === 0) return false;
  const last = await lastSnapshotAt();
  if (last && Date.now() - last.getTime() < SNAPSHOT_MIN_INTERVAL_MS) return false;

  const m = mode();
  const now = new Date();

  for (const t of tokens.slice(0, 40)) {
    const row = await prisma.token.upsert({
      where: { address: t.address },
      create: {
        address: t.address,
        ticker: t.ticker,
        name: t.name,
        narrativeTag: t.narrativeTag,
        marketCapUsd: t.marketCapUsd,
        priceUsd: t.priceUsd,
        liquidityUsd: t.liquidityUsd,
        volume24hUsd: t.volume24hUsd,
        holders: t.holders ?? null,
        priceChange24hPct: t.priceChange24hPct,
        ageMinutes: t.ageMinutes,
        sourceMode: m,
        source: "dexscreener+pumpfun",
      },
      update: {
        ticker: t.ticker,
        name: t.name,
        narrativeTag: t.narrativeTag,
        marketCapUsd: t.marketCapUsd,
        priceUsd: t.priceUsd,
        liquidityUsd: t.liquidityUsd,
        volume24hUsd: t.volume24hUsd,
        holders: t.holders ?? null,
        priceChange24hPct: t.priceChange24hPct,
        ageMinutes: t.ageMinutes,
      },
    });
    await prisma.tokenSnapshot.create({
      data: {
        tokenId: row.id,
        priceUsd: t.priceUsd,
        marketCapUsd: t.marketCapUsd,
        liquidityUsd: t.liquidityUsd,
        volume24hUsd: t.volume24hUsd,
        txns24h: t.txns24h ?? null,
        holders: t.holders ?? null,
        priceChange24hPct: t.priceChange24hPct,
        holdersIsProxy: t.holders === undefined,
        sourceMode: m,
        source: "pipeline",
        calcVersion: CALC_VERSION,
        capturedAt: now,
      },
    });
  }

  // Attention history from the existing engine formulas.
  const classifications: AttentionClassification[] = tokens.map(classifyToken);
  for (const c of classifications.slice(0, 40)) {
    const row = await prisma.token.findUnique({ where: { address: c.address }, select: { id: true } });
    await prisma.attentionSnapshot.create({
      data: {
        tokenId: row?.id ?? null,
        tokenAddress: c.address,
        narrativeTag: c.token.narrativeTag,
        attentionVelocity: c.token.attentionVelocity ?? 0,
        velocityMultiplier: c.velocityMultiplier,
        volumeDeltaPct: c.volumeDeltaPct,
        buyerDeltaPct: c.buyerDeltaPct,
        state: c.state,
        sourceMode: m,
        calcVersion: CALC_VERSION,
        capturedAt: now,
      },
    });
  }
  return true;
}

/** Persist narrative snapshots WITH member-derived aggregates (gated: ≥60s). */
export async function persistNarrativeSnapshotsRich(
  narratives: Narrative[],
  tokens: TokenMetrics[]
): Promise<void> {
  if (!dbEnabled() || narratives.length === 0) return;
  const latest = await prisma.narrativeSnapshot.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });
  if (latest && Date.now() - latest.capturedAt.getTime() < 60_000) return; // 60s gate
  const m = mode();
  const now = new Date();
  for (const n of narratives) {
    const members = tokens.filter((t) => n.tokens.includes(t.address));
    const txns24h = members.reduce((a, t) => a + (t.txns24h ?? 0), 0);
    const activeWallets = members.reduce((a, t) => a + (t.notableWallets ?? 0), 0);
    const registry = await prisma.narrative.upsert({
      where: { slug: n.slug },
      create: { slug: n.slug, name: n.name, description: n.description, sourceMode: m },
      update: { name: n.name, description: n.description },
    });
    await prisma.narrativeSnapshot.create({
      data: {
        narrativeId: registry.id,
        slug: n.slug,
        tokenCount: n.tokenCount,
        volume24hUsd: n.volume24hUsd,
        txns24h: txns24h > 0 ? txns24h : null,
        activeWallets: activeWallets > 0 ? activeWallets : null,
        attentionDeltaPct: n.attentionDeltaPct,
        newLaunches24h: n.newLaunches24h,
        holderGrowthPct: n.holderGrowthPct ?? null,
        sourceMode: m,
        calcVersion: CALC_VERSION,
        capturedAt: now,
      },
    });
  }
}

/** Persist real launches (and creator rows) from the live Pump feed. */
export async function persistLaunches(launches: Launch[]): Promise<void> {
  if (!dbEnabled() || launches.length === 0) return;
  const m = mode();
  for (const l of launches.slice(0, 20)) {
    await prisma.launch.upsert({
      where: { address: l.address },
      create: {
        address: l.address,
        ticker: l.ticker,
        name: l.name,
        creatorAddress: l.creatorAddress ?? null,
        createdAtMs: BigInt(Math.round(l.createdAtMs)),
        marketCapUsd: l.marketCapUsd,
        status: l.status,
        narrativeTag: l.narrativeTag,
        firstBuyer: null,
        sourceMode: m,
        source: "pumpfun",
      },
      update: { marketCapUsd: l.marketCapUsd, status: l.status },
    });
    if (l.creatorAddress) {
      await prisma.creator
        .upsert({
          where: { address: l.creatorAddress },
          create: {
            address: l.creatorAddress,
            launchCount: 1,
            firstLaunchMs: BigInt(Math.round(l.createdAtMs)),
            lastLaunchMs: BigInt(Math.round(l.createdAtMs)),
            narratives: [l.narrativeTag],
            sourceMode: m,
          },
          update: { lastLaunchMs: BigInt(Math.round(l.createdAtMs)) },
        })
        .catch(() => undefined);
    }
  }
}

/** Persist observed first-60s events for a mint (live fetch → archive). */
export async function persistLaunchReplay(
  address: string,
  events: NonNullable<Launch["events"]>
): Promise<void> {
  if (!dbEnabled() || events.length === 0) return;
  const m = mode();
  const launch = await prisma.launch.findUnique({ where: { address }, select: { id: true } });
  if (!launch) return;
  for (const e of events) {
    await prisma.launchEvent.upsert({
      where: {
        launchId_tSeconds_kind_label: {
          launchId: launch.id,
          tSeconds: e.tSeconds,
          kind: e.kind,
          label: e.label,
        },
      },
      create: {
        launchId: launch.id,
        tSeconds: e.tSeconds,
        kind: e.kind,
        label: e.label,
        detail: e.detail ?? null,
        sourceMode: m,
      },
      update: { detail: e.detail ?? null },
    });
  }
  await prisma.launch
    .update({ where: { id: launch.id }, data: { archived: true } })
    .catch(() => undefined);
}

/** Read archived first-60s events (used when live fetch is unavailable). */
export async function readArchivedReplay(address: string) {
  if (!dbEnabled()) return undefined;
  const launch = await prisma.launch.findUnique({
    where: { address },
    include: { events: { orderBy: { tSeconds: "asc" } } },
  });
  if (!launch || launch.events.length === 0) return undefined;
  return launch.events.map((e) => ({
    tSeconds: e.tSeconds,
    kind: e.kind,
    label: e.label,
    detail: e.detail ?? undefined,
  }));
}
