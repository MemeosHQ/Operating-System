import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";
import { sanitizeQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = sanitizeQuery(new URL(req.url).searchParams.get("q") ?? "");
  return handleRoute(`search:${q}`, () => getProviders().search(q));
}
