import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/utils";
import { readDnaHistory, readTokenSnapshots } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isSolanaAddress(address)) {
    return NextResponse.json({ ok: false, error: "Invalid address." }, { status: 400 });
  }
  const [dna, tokens] = await Promise.all([readDnaHistory(address), readTokenSnapshots(address)]);
  if (dna === null || tokens === null) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — historical DNA requires the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, data: { dna, tokenSnapshots: tokens } });
}
