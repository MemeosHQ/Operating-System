import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute("creators", () => getProviders().getCreators());
}
