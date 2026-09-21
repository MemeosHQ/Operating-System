import { mulberry32 } from "@/lib/utils";
import type { Launch, WalletProfile } from "@/lib/types";
import { DEMO_TOKENS, buildLaunchEvents, fakeAddress } from "./data";

/** DETERMINISTIC DEMO DATASET — launches and wallets. */

export function demoLaunches(): Launch[] {
  return DEMO_TOKENS.filter((t) => t.ageMinutes < 60 * 20)
    .sort((a, b) => a.ageMinutes - b.ageMinutes)
    .slice(0, 12)
    .map((t) => ({
      address: t.address,
      name: t.name,
      ticker: t.ticker,
      creatorAddress: t.creatorAddress,
      createdAtMs: Date.now() - t.ageMinutes * 60_000,
      marketCapUsd: t.marketCapUsd,
      status: t.status,
      narrativeTag: t.narrativeTag,
      events: buildLaunchEvents(t),
    }));
}

const RNG = mulberry32(777);

/** Wallets referenced by demo tokens — observable behavior only. */
export function demoWallets(): WalletProfile[] {
  const wallets: WalletProfile[] = [];
  const creators = [...new Set(DEMO_TOKENS.map((t) => t.creatorAddress!))];
  for (let i = 0; i < 10; i++) {
    const address = fakeAddress(`wallet:${i}`);
    const tradeCount = Math.round(3 + RNG() * 9);
    const trades = Array.from({ length: tradeCount }, (_, j) => {
      const t = DEMO_TOKENS[Math.floor(RNG() * DEMO_TOKENS.length)];
      const side = RNG() > 0.42 ? "buy" : "sell";
      return {
        tokenAddress: t.address,
        tokenTicker: t.ticker,
        side: side as "buy" | "sell",
        amountUsd: Math.round(200 + RNG() * 24_000),
        atMs: Date.now() - (j * 40 + Math.round(RNG() * 200)) * 60_000,
      };
    }).sort((a, b) => b.atMs - a.atMs);
    const early = trades.filter((tr) => {
      const t = DEMO_TOKENS.find((d) => d.address === tr.tokenAddress);
      return t && tr.side === "buy" && t.ageMinutes < 180;
    }).length;
    const labels: WalletProfile["labels"] = [];
    if (early >= 2) labels.push("EARLY ENTRY");
    if (tradeCount >= 7) labels.push("HIGH ACTIVITY");
    if (RNG() > 0.6) labels.push("LAUNCH PARTICIPANT");
    if (labels.length === 0) labels.push("UNKNOWN");
    wallets.push({
      address,
      solBalance: Number((RNG() * 400).toFixed(2)),
      labels,
      walletAgeDays: Math.round(10 + RNG() * 600),
      tokenCount: Math.round(2 + RNG() * 30),
      solanaFmUrl: `https://solscan.io/account/${address}`,
      recentTrades: trades,
      launchParticipation: Math.round(RNG() * 6),
      earlyEntries: early,
      notableInteractions: trades.slice(0, 4).map((tr) => tr.tokenTicker),
      availability: { unavailable: [] },
    });
  }
  // Creator addresses are wallets too.
  for (const c of creators) {
    const owned = DEMO_TOKENS.filter((t) => t.creatorAddress === c);
    wallets.push({
      address: c,
      solBalance: Number((RNG() * 120).toFixed(2)),
      labels: ["LAUNCH PARTICIPANT"],
      walletAgeDays: Math.round(20 + RNG() * 400),
      tokenCount: owned.length,
      solanaFmUrl: `https://solscan.io/account/${c}`,
      recentTrades: owned.map((t) => ({
        tokenAddress: t.address,
        tokenTicker: t.ticker,
        side: "buy" as const,
        amountUsd: Math.round(t.marketCapUsd * 0.001),
        atMs: Date.now() - t.ageMinutes * 60_000,
      })),
      launchParticipation: owned.length,
      earlyEntries: 0,
      notableInteractions: owned.map((t) => t.ticker),
      availability: { unavailable: [] },
    });
  }
  return wallets;
}

export function demoWallet(address: string): WalletProfile | undefined {
  return demoWallets().find((w) => w.address === address);
}
