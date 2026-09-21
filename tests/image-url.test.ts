import { describe, it, expect } from "vitest";
import { normalizeTokenImageUrl, buildImageCandidates } from "../src/lib/image-url";

describe("normalizeTokenImageUrl", () => {
  it("keeps valid https URLs", () => {
    expect(normalizeTokenImageUrl("https://cdn.dexscreener.com/cms/images/abc?width=800")).toBe(
      "https://cdn.dexscreener.com/cms/images/abc?width=800"
    );
  });

  it("resolves ipfs:// to an HTTPS IPFS gateway", () => {
    expect(normalizeTokenImageUrl("ipfs://QmTest123/path/logo.png")).toBe(
      "https://ipfs.io/ipfs/QmTest123/path/logo.png"
    );
  });

  it("resolves ar:// through the Arweave gateway", () => {
    expect(normalizeTokenImageUrl("ar://TXID123")).toBe("https://arweave.net/TXID123");
  });

  it("upgrades plain http to https", () => {
    expect(normalizeTokenImageUrl("http://cdn.dexscreener.com/x.png")).toBe(
      "https://cdn.dexscreener.com/x.png"
    );
  });

  it("rejects unsafe protocols", () => {
    expect(normalizeTokenImageUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeTokenImageUrl("data:image/png;base64,xxx")).toBeNull();
    expect(normalizeTokenImageUrl("ftp://example.com/x.png")).toBeNull();
    expect(normalizeTokenImageUrl("")).toBeNull();
    expect(normalizeTokenImageUrl(undefined)).toBeNull();
  });
});

describe("buildImageCandidates", () => {
  it("expands IPFS CIDs into multiple gateways for fallback", () => {
    const out = buildImageCandidates("ipfs://QmTest");
    expect(out).toEqual([
      "https://gateway.pinata.cloud/ipfs/QmTest",
      "https://ipfs.io/ipfs/QmTest",
      "https://4everland.io/ipfs/QmTest",
    ]);
  });

  it("expands existing gateway forms too (e.g. DexScreener dweb.link)", () => {
    const out = buildImageCandidates("https://dweb.link/ipfs/QmTest");
    expect(out[0]).toBe("https://gateway.pinata.cloud/ipfs/QmTest");
    expect(out).toContain("https://dweb.link/ipfs/QmTest");
  });

  it("deduplicates and preserves priority order", () => {
    const out = buildImageCandidates(
      "ipfs://QmTest",
      "https://ipfs.io/ipfs/QmTest",
      "https://cdn.dexscreener.com/x.png",
      undefined,
      "javascript:alert(1)"
    );
    expect(out[0]).toBe("https://gateway.pinata.cloud/ipfs/QmTest");
    expect(out).toContain("https://cdn.dexscreener.com/x.png");
    expect(out).not.toContain("javascript:alert(1)");
  });

  it("returns empty for no valid candidates", () => {
    expect(buildImageCandidates(undefined, "data:x", null)).toEqual([]);
  });
});
