import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  return handleRoute(`token:${address}`, () => getProviders().getToken(address));
}
