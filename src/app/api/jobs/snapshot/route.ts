import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { ensureTokenSnapshots, persistLaunches, persistNarrativeSnapshotsRich } from "@/lib/server/pipeline";

export const dynamic = "force-dynamic";

/**
 * Cron-friendly snapshot job (POST). Runs the same gated pipeline the lazy
 * request hooks use:
 *   local dev:  curl -X POST http://localhost:3000/api/jobs/snapshot
 *   production: a scheduler (Vercel Cron / Hostinger cron / GitHub Action)
 *               hitting this endpoint every 10–15 minutes.
 * Snapshotting is idempotent behind minimum intervals.
 */
export async function POST() {
  return handleRoute("jobs:snapshot", async () => {
    const p = getProviders();
    const [tokens, launches, narratives] = await Promise.all([
      p.getTokens(),
      p.getLaunches().catch(() => []),
      p.getNarratives(),
    ]);
    const tokensSnapshotted = await ensureTokenSnapshots(tokens);
    await persistLaunches(launches).catch(() => undefined);
    await persistNarrativeSnapshotsRich(narratives, tokens).catch(() => undefined);
    return {
      snapshotTaken: tokensSnapshotted,
      tokensObserved: tokens.length,
      launchesObserved: launches.length,
      note: tokensSnapshotted
        ? "snapshots persisted"
        : "skipped — latest snapshot younger than the interval",
    };
  });
}
