import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { detectAgents } from "@/lib/server/intel";

export const dynamic = "force-dynamic";

/**
 * Agents now run on PERSISTED observed behavior. With no qualifying evidence
 * yet we honestly return an empty set + active status — never fake agents.
 */
export async function GET() {
  return handleRoute("agents", async () => {
    const detected = await detectAgents().catch(() => undefined);
    if (detected) return detected;
    return getProviders().getAgents();
  });
}
