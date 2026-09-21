"use client";

import { useState } from "react";
import { Panel, PanelHeader, Button, TokenLogo } from "@/components/ui/kit";
import { DnaResult } from "@/components/dna-result";
import { fmtUsd, isSolanaAddress, cn } from "@/lib/utils";
import type { TokenMetrics } from "@/lib/types";
import { useApi } from "@/lib/hooks/use-api";

/** MEME DNA — the signature analytical feature. */
export default function DnaPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const invalid = query.length > 0 && !isSolanaAddress(query);

  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const examples = (tokens ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Meme DNA</h1>
        <p className="mt-1 text-[14px] text-muted">
          Paste any Solana token address to sequence its genome.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (isSolanaAddress(query)) setSubmitted(query.trim());
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste token address…"
          className={cn(
            "min-w-0 flex-1 rounded-md border bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none placeholder:text-faint",
            invalid ? "border-down/60" : "border-edge2 focus:border-accent"
          )}
        />
        <Button type="submit" variant="primary" disabled={!isSolanaAddress(query)}>
          Sequence
        </Button>
      </form>
      {invalid && <p className="text-[12px] text-down">That doesn&apos;t look like a valid Solana address.</p>}

      {!submitted && (
        <Panel>
          <PanelHeader title="Quick sequence" sub="Pick from currently tracked tokens" />
          <div className="flex flex-wrap gap-2 p-4">
            {examples.map((t) => (
              <button
                key={t.address}
                onClick={() => {
                  setQuery(t.address);
                  setSubmitted(t.address);
                }}
                className="flex items-center gap-2 rounded-md border border-edge2 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-accent"
              >
                <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={18} />
                <span className="font-mono">{t.ticker}</span>
                <span className="text-faint">{fmtUsd(t.marketCapUsd)}</span>
              </button>
            ))}
            {examples.length === 0 && (
              <p className="text-[12px] text-faint">Loading tracked tokens…</p>
            )}
          </div>
        </Panel>
      )}

      {submitted && <DnaResult address={submitted} />}
    </div>
  );
}
