import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { DataUnavailableError } from "@/lib/errors";
import { persistLaunchReplay, readArchivedReplay } from "@/lib/server/pipeline";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  return handleRoute(`launch-replay:${address}`, async () => {
    try {
      const launch = await getProviders().getLaunchReplay(address);
      // Archive observed events so replay survives provider gaps.
      await persistLaunchReplay(address, launch.events ?? []).catch(() => undefined);
      return launch;
    } catch (err) {
      // Live fetch failed — serve the archived observed events when we have them.
      const archived = await readArchivedReplay(address);
      if (archived && archived.length > 0) {
        const base = await getProviders().getToken(address).catch(() => undefined);
        return {
          address,
          name: base?.name ?? address.slice(0, 6),
          ticker: base?.ticker ?? "??",
          creatorAddress: base?.creatorAddress,
          createdAtMs: Date.now() - 60_000,
          marketCapUsd: base?.marketCapUsd ?? 0,
          status: base?.status ?? "new",
          narrativeTag: base?.narrativeTag ?? "meta",
          events: archived.map((e) => ({ tSeconds: e.tSeconds, kind: e.kind as never, label: e.label })),
          sourceMode: "archived" as const,
        };
      }
      throw err instanceof DataUnavailableError ? err : err;
    }
  });
}
