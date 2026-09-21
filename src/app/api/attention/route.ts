import { handleRoute } from "@/lib/server/route";
import { getNarrativeIntelligence } from "@/lib/server/narrative-intelligence";

export const dynamic = "force-dynamic";

/**
 * Attention — token-level classification + the SAME canonical narrative state
 * as /api/narratives (shared service, shared snapshots, same generatedAt).
 */
export async function GET() {
  return handleRoute("attention", async () => {
    const { tokenAttention, narratives, generatedAt } = await getNarrativeIntelligence();
    return { tokens: tokenAttention, narratives, generatedAt };
  });
}
