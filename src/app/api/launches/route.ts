import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { persistLaunches } from "@/lib/server/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute("launches", async () => {
    const launches = await getProviders().getLaunches();
    await persistLaunches(launches).catch(() => undefined);
    return launches;
  });
}
