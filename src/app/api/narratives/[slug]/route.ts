import { handleRoute } from "@/lib/server/route";
import { getProviders } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handleRoute(`narrative:${slug}`, () => getProviders().getNarrative(slug));
}
