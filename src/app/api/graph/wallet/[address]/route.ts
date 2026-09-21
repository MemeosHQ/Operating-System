import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/utils";
import { readWalletGraph } from "@/lib/server/intel";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isSolanaAddress(address)) {
    return NextResponse.json({ ok: false, error: "Invalid address." }, { status: 400 });
  }
  const graph = await readWalletGraph(address);
  if (graph === null) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — the wallet graph requires the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({
    ok: true,
    data: {
      ...graph,
      note:
        graph.edges.length === 0
          ? "NO VERIFIED RELATIONSHIPS YET — edges appear only from observed on-chain behavior."
          : "Edges derive exclusively from observed on-chain trades (evidence attached).",
    },
  });
}
