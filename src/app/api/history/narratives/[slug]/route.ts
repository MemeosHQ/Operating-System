import { NextResponse } from "next/server";
import { readNarrativeHistory } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const history = await readNarrativeHistory(slug);
  if (history === null) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — narrative history requires the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, data: history });
}
