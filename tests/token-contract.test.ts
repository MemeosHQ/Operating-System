import { describe, it, expect } from "vitest";
import { resolveTokenContract } from "../src/lib/token-contract";

/** Valid Solana public key (base58, 32-byte) — a well-known system program. */
const VALID_CA = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const INVALID_CA = "not-a-real-address";

describe("token contract bar states", () => {
  it("STATE 1 — no CA → TBA, no links, no actions", () => {
    const r = resolveTokenContract("", "");
    expect(r.state).toBe("tba");
    expect(r.raw).toBe("");
    expect(r.short).toBeUndefined();
    expect(r.solscanUrl).toBeUndefined();
    expect(r.buyUrl).toBeUndefined();
  });

  it('STATE 1 — literal "TBA" (any case) → TBA', () => {
    expect(resolveTokenContract("TBA").state).toBe("tba");
    expect(resolveTokenContract("tba").state).toBe("tba");
  });

  it("STATE 2 — valid CA → short address, Solscan, copy-ready", () => {
    const r = resolveTokenContract(VALID_CA, "");
    expect(r.state).toBe("configured");
    expect(r.raw).toBe(VALID_CA);
    expect(r.short).toMatch(/…/);
    expect(r.solscanUrl).toBe(`https://solscan.io/token/${VALID_CA}`);
    expect(r.buyUrl).toBeUndefined(); // no buy URL → Coming Soon
  });

  it("STATE 2 — with buy URL configured → buy active", () => {
    const r = resolveTokenContract(VALID_CA, "https://jup.ag/tokens/" + VALID_CA);
    expect(r.state).toBe("configured");
    expect(r.buyUrl).toBe("https://jup.ag/tokens/" + VALID_CA);
  });

  it("STATE 3 — invalid CA → invalid, no Solscan, no buy", () => {
    const r = resolveTokenContract(INVALID_CA, "https://example.com");
    expect(r.state).toBe("invalid");
    expect(r.solscanUrl).toBeUndefined();
    expect(r.buyUrl).toBeUndefined();
    expect(r.raw).toBe(INVALID_CA);
  });

  it("never accepts a look-alike address (checksum/base58)", () => {
    // 0x-prefixed EVM-style string must NOT pass as a Solana mint
    expect(resolveTokenContract("0x997dfb8b8fe82d2ae314e09ba428eb93230f27e4").state).toBe("invalid");
  });
});
