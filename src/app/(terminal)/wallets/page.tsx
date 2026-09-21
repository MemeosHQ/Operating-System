"use client";

import { useState } from "react";
import { isSolanaAddress } from "@/lib/utils";
import { Panel, Button } from "@/components/ui/kit";
import { WalletIntel } from "@/components/wallet-intel";

export default function WalletsPage() {
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const invalid = query.length > 0 && !isSolanaAddress(query);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Wallet Intelligence</h1>
        <p className="mt-1 text-[14px] text-muted">
          Observable wallet behavior — transparent labels, never unearned verdicts.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (isSolanaAddress(query)) setAddress(query.trim());
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wallet address…"
          className={invalid ? "min-w-0 flex-1 rounded-md border border-down/60 bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none" : "min-w-0 flex-1 rounded-md border border-edge2 bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"}
        />
        <Button type="submit" variant="primary" disabled={!isSolanaAddress(query)}>
          Analyze
        </Button>
      </form>
      {invalid && <p className="text-[12px] text-down">That doesn&apos;t look like a valid Solana address.</p>}

      {address && <WalletIntel address={address} />}
      {!address && (
        <Panel className="p-6 text-center">
          <p className="text-[13px] text-muted">
            Paste any Solana address above. Wallet profiles use observable behavior only —
            a wallet is never called &quot;smart money&quot; from a single transaction.
          </p>
        </Panel>
      )}
    </div>
  );
}
