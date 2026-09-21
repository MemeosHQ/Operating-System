"use client";

import { useApp } from "@/lib/providers/app-provider";
import { Panel, PanelHeader, Badge } from "@/components/ui/kit";

/** Settings — data mode, storage and key documentation. */
export default function SettingsPage() {
  const { mode, watchlist } = useApp();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[14px] text-muted">Environment and data configuration.</p>
      </div>

      <Panel>
        <PanelHeader title="Data mode" sub="Set via NEXT_PUBLIC_DATA_MODE in .env.local" />
        <div className="space-y-2 p-4 text-[13px] text-muted">
          <p>
            Current: <Badge tone={mode === "live" ? "live" : "accent"}>{mode}</Badge>
          </p>
          <p className="text-[12px] leading-relaxed text-faint">
            <b className="text-ink">demo</b> — deterministic sample data, always labeled.{" "}
            <b className="text-ink">live</b> — real providers (DexScreener, Pump.fun, Solana
            RPC). Capabilities needing keys (holder analytics, wallet history, launch
            replay, agents) fail honestly and name the missing env var.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Watchlist storage" sub="Local-first, account-ready" />
        <p className="p-4 text-[13px] text-muted">
          {watchlist.length} item(s) stored in this browser (localStorage). The storage
          shape maps 1:1 onto a server-side <span className="font-mono text-accent-soft">UserWatchlist</span>{" "}
          once authentication is added — no UI change required.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Optional server keys" sub="See API_AUDIT.md / LIVE_DATA_SETUP.md for details" />
        <div className="space-y-1 p-4 font-mono text-[12px] text-muted">
          <p>HELIUS_API_KEY — wallet history, launch events, agent detection</p>
          <p>BIRDEYE_API_KEY — live holder counts for Meme DNA</p>
          <p>GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY — LLM analyst</p>
          <p>DATABASE_URL — persistent watchlists &amp; snapshot history</p>
        </div>
      </Panel>
    </div>
  );
}
