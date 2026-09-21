import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { ensureTokenSnapshots } from "@/lib/server/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute("tokens", async () => {
    const tokens = await getProviders().getTokens();
    // Lazy gated persistence — a no-op when the latest snapshot is fresh.
    await ensureTokenSnapshots(tokens).catch(() => undefined);
    return tokens;
  });
}
