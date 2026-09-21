import { handleRoute } from "@/lib/server/route";
import { getNarrativeIntelligence } from "@/lib/server/narrative-intelligence";

export const dynamic = "force-dynamic";

/**
 * Canonical narratives — served from the SHARED narrative-intelligence
 * service (same calculation, same snapshot, same generatedAt as /attention).
 */
export async function GET() {
  return handleRoute("narratives", async () => {
    const { narratives } = await getNarrativeIntelligence();
    return narratives;
  });
}
