import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { writeDnaSnapshots } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  return handleRoute(`dna:${address}`, async () => {
    const dna = await getProviders().getDna(address);
    // Persist the dimension scores (proxy dimensions stay labeled proxy).
    await writeDnaSnapshots(
      address,
      dna.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, basis: d.basis }))
    ).catch(() => undefined);
    return dna;
  });
}
