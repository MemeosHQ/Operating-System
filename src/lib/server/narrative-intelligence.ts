import "server-only";
import { getProviders } from "@/lib/services";
import { persistNarrativeSnapshotsRich } from "@/lib/server/pipeline";
import { readNarrativeHistory, readNarrativeSnapshotRows } from "@/lib/server/history";
import {
  computeNarrativeMomentum,
  pickPreviousSnapshot,
  MOMENTUM_WINDOW_MAX_MS,
} from "@/lib/metrics/narrative-momentum";
import type { AttentionClassification, Narrative } from "@/lib/types";

/**
 * CANONICAL NARRATIVE INTELLIGENCE — the single source of truth consumed by
 * BOTH /api/narratives and /api/attention (and therefore the /narratives and
 * /attention pages).
 *
 * One provider aggregation → one canonical momentum calculation →
 * multiple page consumers. There is no second momentum formula anywhere.
 *
 * A short in-process cache (20s) guarantees both pages literally share the
 * same snapshot (same generatedAt) within one refresh cycle.
 */

export interface NarrativeIntelligence {
  /** Canonical narratives with momentumPct / momentumStatus / history timelines. */
  narratives: Narrative[];
  /** Token-level attention classification (token attention ≠ narrative momentum). */
  tokenAttention: AttentionClassification[];
  /** Server timestamp of this canonical calculation. */
  generatedAt: string;
}

interface CacheEntry {
  at: number;
  value: NarrativeIntelligence;
}

/**
 * Snapshot cycles are aligned to the wall clock (30s windows). Every request
 * inside the same window receives the IDENTICAL canonical object — so
 * /narratives and /attention always share one generatedAt and one calculation
 * per cycle. The cache lives on globalThis because Next.js gives each route
 * bundle its own module instance; the standard singleton pattern shares one
 * cache across all routes in the same process.
 */
const CYCLE_MS = 30_000;
const globalCache = globalThis as { __memeosNarrativeCache?: CacheEntry };

function sameCycle(a: number, b: number) {
  return Math.floor(a / CYCLE_MS) === Math.floor(b / CYCLE_MS);
}

export async function getNarrativeIntelligence(force = false): Promise<NarrativeIntelligence> {
  const now = Date.now();
  const cachedEntry = globalCache.__memeosNarrativeCache;
  if (!force && cachedEntry && sameCycle(cachedEntry.at, now)) return cachedEntry.value;

  const p = getProviders();
  const [narrativesRaw, tokens, tokenAttention] = await Promise.all([
    p.getNarratives(),
    p.getTokens().catch(() => []),
    p.classify().catch(() => [] as AttentionClassification[]),
  ]);
  await persistNarrativeSnapshotsRich(narrativesRaw, tokens).catch(() => undefined);
  const generatedAt = new Date().toISOString();

  const narratives = await Promise.all(
    narrativesRaw.map(async (n) => {
      // Momentum vs. a real previous observed snapshot (5–20 min window) —
      // the canonical engine. null → BUILDING_BASELINE (never fake −100%/0%).
      const rows = await readNarrativeSnapshotRows(n.slug, MOMENTUM_WINDOW_MAX_MS).catch(
        () => undefined
      );
      let momentumPct: number | null = null;
      let momentumStatus: Narrative["momentumStatus"] = "BUILDING_BASELINE";
      if (rows && rows.length > 0) {
        const previous = pickPreviousSnapshot(rows, Date.now());
        if (previous) {
          const members = tokens.filter((t) => n.tokens.includes(t.address));
          const current = {
            volume24hUsd: n.volume24hUsd,
            txns24h: members.reduce((a, t) => a + (t.txns24h ?? 0), 0) as number | null,
            attentionDeltaPct: n.attentionDeltaPct,
            newLaunches24h: n.newLaunches24h,
            tokenCount: n.tokenCount,
            activeWallets: null,
          };
          const result = computeNarrativeMomentum(current, previous);
          momentumPct = result.momentumPct;
          momentumStatus = result.status;
        }
      }
      const members = tokens.filter((t) => n.tokens.includes(t.address));
      const activeWallets = members.reduce((a, t) => a + (t.notableWallets ?? 0), 0) || null;

      // Real persisted attention history for the timeline.
      const history = await readNarrativeHistory(n.slug, 12).catch(() => undefined);
      const timeline =
        history && history.length >= 2
          ? {
              source: "database" as const,
              points: [...history]
                .reverse()
                .map((h) => ({
                  label: h.capturedAt.slice(11, 19),
                  attention: Math.max(0, Math.min(100, Math.round(50 + h.attentionDeltaPct / 2))),
                })),
            }
          : { source: "modeled" as const, points: n.timeline };

      return {
        ...n,
        generatedAt,
        timelineSource: timeline.source,
        timeline: timeline.points,
        momentumPct,
        momentumStatus,
        activeWallets,
      };
    })
  );

  const value: NarrativeIntelligence = { narratives, tokenAttention, generatedAt };
  globalCache.__memeosNarrativeCache = { at: Date.now(), value };
  return value;
}
