import { describe, it, expect } from "vitest";
import { DemoProvider } from "@/lib/services/demo/provider";
import { demoTokens } from "@/lib/services/demo/data";
import { demoWallets, demoLaunches } from "@/lib/services/demo/derived";
import { demoCreators, demoAgents } from "@/lib/services/demo/people";
import { isSolanaAddress } from "@/lib/utils";

describe("demo dataset integrity", () => {
  it("all generated addresses pass Solana format validation", () => {
    for (const t of demoTokens) expect(isSolanaAddress(t.address)).toBe(true);
    for (const w of demoWallets()) expect(isSolanaAddress(w.address)).toBe(true);
    for (const c of demoCreators()) expect(isSolanaAddress(c.address)).toBe(true);
    for (const a of demoAgents()) expect(isSolanaAddress(a.address)).toBe(true);
  });

  it("is deterministic — same ticker → same address", () => {
    const first = demoTokens.map((t) => t.address).join("|");
    const second = demoTokens.map((t) => t.address).join("|");
    expect(first).toBe(second);
  });

  it("every token has positive market cap and attention velocity", () => {
    for (const t of demoTokens) {
      expect(t.marketCapUsd).toBeGreaterThan(0);
      expect(t.attentionVelocity).toBeDefined();
    }
  });

  it("launch replays stay within a sensible first-minute structure", () => {
    for (const l of demoLaunches()) {
      expect(l.events?.length).toBeGreaterThan(3);
      expect(l.events![0].tSeconds).toBe(0);
      const snap = l.events!.find((e) => e.kind === "snapshot");
      expect(snap?.tSeconds).toBe(60);
    }
  });
});

describe("DemoProvider (the demo-mode data plane)", () => {
  const p = new DemoProvider();

  it("serves tokens, narratives ranked by momentum, and creators", async () => {
    const tokens = await p.getTokens();
    expect(tokens.length).toBeGreaterThan(10);
    const narratives = await p.getNarratives();
    expect(narratives.length).toBeGreaterThan(3);
    const sorted = [...narratives].sort((a, b) => b.attentionDeltaPct - a.attentionDeltaPct);
    expect(narratives[0].slug).toBe(sorted[0].slug);
    const creators = await p.getCreators();
    expect(creators.length).toBeGreaterThan(0);
  });

  it("returns a full DNA profile with 8 dimensions and evolution", async () => {
    const dna = await p.getDna(demoTokens[0].address);
    expect(dna.dimensions).toHaveLength(8);
    expect(dna.evolution.length).toBe(4);
  });

  it("classify() partitions tokens into attention states", async () => {
    const items = await p.classify();
    const states = new Set(items.map((i) => i.state));
    expect(states.size).toBeGreaterThanOrEqual(2);
  });

  it("search finds tokens by ticker and wallets by address", async () => {
    const byTicker = await p.search("DOGAI");
    expect(byTicker.tokens.length).toBeGreaterThan(0);
    const wallet = demoWallets()[0];
    const byAddress = await p.search(wallet.address);
    expect(byAddress.wallets[0].address).toBe(wallet.address);
  });

  it("wallet lookups for unknown-but-valid addresses fail honestly", async () => {
    const fake = "1111111111111111111111111111111111111111111";
    await expect(p.getWallet(fake)).rejects.toThrow(/demo dataset|HELIUS/i);
  });

  it("the analyst answers from data and labels its reasoning", async () => {
    const answer = await p.ask("Why is this token gaining attention?", {
      tokenAddress: demoTokens[0].address,
    });
    expect(answer.provider).toBe("rule-engine");
    expect(answer.sections.length).toBeGreaterThan(0);
    const kinds = new Set(answer.sections.map((s) => s.kind));
    expect(kinds.has("observed")).toBe(true);
    expect(kinds.has("calculated")).toBe(true);
    const narrativeAnswer = await p.ask("What narrative is accelerating?");
    expect(narrativeAnswer.sections.length).toBeGreaterThan(0);
  });

  it("health reports DEMO — never fake LIVE", async () => {
    const h = await p.health();
    expect(h.data).toBe("demo");
  });
});
