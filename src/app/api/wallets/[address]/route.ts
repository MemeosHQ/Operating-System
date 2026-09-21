import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { getWalletTransactions } from "@/lib/services/live/helius";
import { persistWalletActivity } from "@/lib/server/intel";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  return handleRoute(`wallet:${address}`, async () => {
    const profile = await getProviders().getWallet(address);
    // Persist parsed activity + derive wallet→token edges from real trades.
    try {
      const txs = await getWalletTransactions(address);
      await persistWalletActivity(
        address,
        profile.solBalance,
        txs.map((t) => ({
          signature: t.signature,
          mint: t.mint,
          solAmount: t.solAmount,
          tokenAmount: t.tokenAmount,
          timestamp: t.timestamp,
          kind: t.kind,
        }))
      );
    } catch {
      /* persistence is best-effort — the live profile still serves */
    }
    return profile;
  });
}
