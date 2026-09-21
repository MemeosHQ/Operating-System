"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, type WatchItem } from "@/lib/providers/app-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { Panel, PanelHeader, Badge, Button } from "@/components/ui/kit";
import { EmptyState } from "@/components/ui/states";
import { relTime } from "@/lib/utils";

const KIND_ROUTE: Record<WatchItem["kind"], (id: string) => string> = {
  token: (id) => `/token/${id}`,
  wallet: (id) => `/wallet/${id}`,
  narrative: (id) => `/narrative/${id}`,
  creator: (id) => `/creator/${id}`,
};

type SyncState = "local" | "synced" | "syncing" | "error";

export default function WatchlistPage() {
  const { watchlist, toggleWatch, mode } = useApp();
  const { connected, publicKey } = useWallet();
  const [sync, setSync] = useState<SyncState>("local");

  // Server-side persistence keyed by the connected wallet address.
  // LocalStorage remains the fallback when no wallet is connected.
  useEffect(() => {
    if (!connected || !publicKey) {
      setSync("local");
      return;
    }
    const wallet = publicKey.toBase58();
    setSync("syncing");
    (async () => {
      try {
        // Push local items, then pull the merged server list.
        for (const w of watchlist) {
          await fetch("/api/watchlist", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              wallet,
              item: { kind: w.kind, id: w.id, label: w.label },
            }),
          });
        }
        const res = await fetch(`/api/watchlist?wallet=${wallet}`);
        const json = (await res.json()) as {
          ok: boolean;
          data?: WatchItem[];
        };
        if (json.ok && Array.isArray(json.data)) {
          // Merge server items into the local store (by kind:id).
          for (const item of json.data) {
            if (!watchlist.some((w) => w.kind === item.kind && w.id === item.id)) {
              toggleWatch({ kind: item.kind, id: item.id, label: item.label });
            }
          }
        }
        setSync(json.ok ? "synced" : "error");
      } catch {
        setSync("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  const syncBadge = (
    <Badge tone={sync === "synced" ? "live" : sync === "error" ? "warn" : "accent"}>
      {sync === "synced"
        ? "SYNCED — server persistence"
        : sync === "syncing"
          ? "syncing…"
          : sync === "error"
            ? "server unavailable — local only"
            : "LOCAL — connect a wallet to sync"}
    </Badge>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Watchlist</h1>
          <p className="mt-1 text-[14px] text-muted">
            Saved tokens, wallets, narratives and creators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={mode === "live" ? "live" : "accent"}>
            {mode === "live" ? "live data" : "demo data"}
          </Badge>
          {syncBadge}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          hint="Watch any token, wallet, narrative or creator with the ☆ button — items persist in this browser, and sync to the server when a wallet is connected."
          action={
            <Link href="/live">
              <Button variant="primary">Browse live tokens</Button>
            </Link>
          }
        />
      ) : (
        <Panel>
          <PanelHeader title={`${watchlist.length} items`} sub="Newest first" />
          <div className="divide-y divide-edge/60">
            {[...watchlist].reverse().map((w) => (
              <div key={`${w.kind}:${w.id}`} className="flex items-center gap-3 px-4 py-2.5">
                <Badge tone="accent">{w.kind}</Badge>
                <Link href={KIND_ROUTE[w.kind](w.id)} className="truncate text-[13px] text-ink hover:text-accent-soft">
                  {w.label}
                </Link>
                <span className="ml-auto text-[11px] text-faint">added {relTime(w.addedAt)}</span>
                <button
                  onClick={() => toggleWatch({ kind: w.kind, id: w.id, label: w.label })}
                  className="text-[12px] text-faint hover:text-down"
                  aria-label={`Remove ${w.label} from watchlist`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
