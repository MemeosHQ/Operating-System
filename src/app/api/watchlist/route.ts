import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/utils";
import { watchlistAdd, watchlistItems, watchlistRemove } from "@/lib/server/history";

export const dynamic = "force-dynamic";

/**
 * Server-side watchlist keyed by the connected wallet's public address
 * (the existing wallet-identity model — no auth ceremony, read-only).
 */
function walletFrom(url: URL): string | null {
  const w = url.searchParams.get("wallet");
  return w && isSolanaAddress(w) ? w : null;
}

export async function GET(req: Request) {
  const wallet = walletFrom(new URL(req.url));
  if (!wallet) {
    return NextResponse.json({ ok: false, error: "Valid ?wallet= address required." }, { status: 400 });
  }
  const items = await watchlistItems(wallet);
  if (items === null) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — server watchlists require the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => undefined)) as
    | { wallet?: string; item?: { kind: string; id: string; label: string } }
    | undefined;
  const wallet = body?.wallet;
  const item = body?.item;
  if (!wallet || !isSolanaAddress(wallet) || !item?.kind || !item.id) {
    return NextResponse.json({ ok: false, error: "wallet + item {kind,id,label} required." }, { status: 400 });
  }
  const ok = await watchlistAdd(wallet, item);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — server watchlists require the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => undefined)) as
    | { wallet?: string; kind?: string; id?: string }
    | undefined;
  const wallet = body?.wallet;
  if (!wallet || !isSolanaAddress(wallet) || !body?.kind || !body.id) {
    return NextResponse.json({ ok: false, error: "wallet + kind + id required." }, { status: 400 });
  }
  const ok = await watchlistRemove(wallet, body.kind, body.id);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "DATABASE UNAVAILABLE — server watchlists require the persistence layer." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}
