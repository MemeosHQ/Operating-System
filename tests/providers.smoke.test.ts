import { describe, it, expect } from "vitest";
import { resolveDataMode } from "../src/lib/server/env";

/**
 * Provider smoke tests.
 *
 * Always-on: configuration resolution (no network).
 * Env-gated: real upstream connectivity — set RUN_LIVE_SMOKE=1 (optionally
 * with HELIUS_API_KEY / BIRDEYE_API_KEY) to run the live probes. Without the
 * flag the live tests are SKIPPED, never faked.
 */

describe("data-mode resolution", () => {
  it("MEMEOS_DEMO_MODE=true forces demo", () => {
    process.env.MEMEOS_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_DATA_MODE = "live";
    expect(resolveDataMode()).toBe("demo");
  });

  it("MEMEOS_DEMO_MODE=false forces live", () => {
    process.env.MEMEOS_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_DATA_MODE = "demo";
    expect(resolveDataMode()).toBe("live");
  });

  it("falls back to NEXT_PUBLIC_DATA_MODE", () => {
    delete process.env.MEMEOS_DEMO_MODE;
    process.env.NEXT_PUBLIC_DATA_MODE = "live";
    expect(resolveDataMode()).toBe("live");
  });

  it("defaults to demo", () => {
    delete process.env.MEMEOS_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DATA_MODE;
    expect(resolveDataMode()).toBe("demo");
  });

  it("helius detection follows the environment flag", async () => {
    // env.ts snapshots keys at import time; verify current-process truth only.
    const configured = Boolean(process.env.HELIUS_API_KEY?.trim());
    const mod = await import("../src/lib/server/env");
    expect(typeof mod.heliusConfigured()).toBe("boolean");
    // If a key IS configured in this environment, it must be detected.
    if (configured) expect(mod.heliusConfigured()).toBe(true);
  });
});

const SMOKE = process.env.RUN_LIVE_SMOKE === "1";

describe.skipIf(!SMOKE)("live upstream connectivity (RUN_LIVE_SMOKE=1)", () => {
  it(
    "DexScreener responds",
    { timeout: 15_000 },
    async () => {
      const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL");
      expect(res.ok).toBe(true);
      const json = (await res.json()) as { pairs?: unknown[] };
      expect(Array.isArray(json.pairs)).toBe(true);
    }
  );

  it(
    "Pump.fun public API responds",
    { timeout: 15_000 },
    async () => {
      const res = await fetch(
        "https://frontend-api-v3.pump.fun/coins?offset=0&limit=1&sort=created_timestamp&order=DESC&includeNsfw=false"
      );
      expect(res.ok).toBe(true);
    }
  );

  it(
    "Solana RPC answers getSlot",
    { timeout: 15_000 },
    async () => {
      const res = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [] }),
      });
      const json = (await res.json()) as { result?: number };
      expect(typeof json.result === "number" && json.result > 0).toBe(true);
    }
  );

  it.skipIf(!process.env.HELIUS_API_KEY)(
    "Helius RPC answers getSlot with the configured key",
    { timeout: 15_000 },
    async () => {
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [] }),
        }
      );
      const json = (await res.json()) as { result?: number };
      expect(typeof json.result === "number" && json.result > 0).toBe(true);
    }
  );

  it.skipIf(!process.env.BIRDEYE_API_KEY)(
    "Birdeye token overview answers with the configured key",
    { timeout: 15_000 },
    async () => {
      const res = await fetch(
        "https://public-api.birdeye.so/defi/token_overview?address=So11111111111111111111111111111111111111112",
        { headers: { "X-API-KEY": process.env.BIRDEYE_API_KEY!, chain: "solana" } }
      );
      expect(res.ok).toBe(true);
    }
  );
});
