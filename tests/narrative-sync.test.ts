import { describe, it, expect } from "vitest";

/**
 * TWO-PAGE CONSISTENCY — /api/narratives vs /api/attention must expose the
 * SAME canonical narrative state (shared narrative-intelligence service:
 * same snapshots, same momentum, same generatedAt).
 *
 * Runs against a live server (default http://localhost:3000, override with
 * MEMEOS_TEST_BASE_URL). Skips — never fakes — when no server is reachable.
 */

const BASE = process.env.MEMEOS_TEST_BASE_URL ?? "http://localhost:3000";

async function reachable() {
  try {
    const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch {
    return false;
  }
}

interface NarrativeLike {
  slug: string;
  momentumPct: number | null;
  momentumStatus?: string;
  tokenCount: number;
  volume24hUsd: number;
  generatedAt?: string;
}

const up = await reachable();

(up ? describe : describe.skip)("canonical narrative consistency (narratives ↔ attention)", () => {
  it(
    "both APIs return the same canonical narrative state",
    async () => {
      // Fetch attention, then retry narratives until both calls land in the
      // same 30s canonical snapshot window (boundary-straddle tolerant).
      let narr!: { data: NarrativeLike[] };
      let att!: { data: { tokens: unknown[]; narratives: NarrativeLike[]; generatedAt: string } };
      for (let attempt = 0; attempt < 6; attempt++) {
        const [narrRes, attRes] = await Promise.all([
          fetch(`${BASE}/api/narratives`, { signal: AbortSignal.timeout(60_000) }),
          fetch(`${BASE}/api/attention`, { signal: AbortSignal.timeout(60_000) }),
        ]);
        expect(narrRes.ok).toBe(true);
        expect(attRes.ok).toBe(true);
        narr = (await narrRes.json()) as { data: NarrativeLike[] };
        att = (await attRes.json()) as { data: { tokens: unknown[]; narratives: NarrativeLike[]; generatedAt: string } };
        if (att.data.generatedAt === narr.data[0]?.generatedAt) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      expect(att.data.generatedAt).toBe(narr.data[0]?.generatedAt);

      const bySlugN = new Map(narr.data.map((n) => [n.slug, n]));
      expect(att.data.narratives.length).toBe(narr.data.length);
      // Same snapshot: the 20s shared-service cache means identical generatedAt.
      expect(att.data.generatedAt).toBe(narr.data[0]?.generatedAt);

      for (const a of att.data.narratives) {
        const n = bySlugN.get(a.slug);
        expect(n, `narrative ${a.slug} present in both payloads`).toBeTruthy();
        expect(a.momentumPct).toBe(n!.momentumPct);
        expect(a.momentumStatus).toBe(n!.momentumStatus);
        expect(a.tokenCount).toBe(n!.tokenCount);
        expect(a.volume24hUsd).toBe(n!.volume24hUsd);
      }
    },
    90_000
  );
});
