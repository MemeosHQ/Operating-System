import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/utils";
import { readAttentionHistory } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isSolanaAddress(address)) {
    return NextResponse.json({ ok: false, error: "Invalid address." }, { status: 400 });
  }
  const history = await readAttentionHistory(address);
  if (history === null) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — historical attention requires the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, data: history });
}
