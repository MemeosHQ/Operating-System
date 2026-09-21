import { describe, it, expect } from "vitest";
import { isSolanaAddress, fmtUsd, shortAddr, fmtSeconds } from "@/lib/utils";
import { sanitizePrompt, sanitizeQuery, validateAddress } from "@/lib/validation";
import { DataUnavailableError, toUserFacingError } from "@/lib/errors";

describe("solana address validation", () => {
  const valid =
    "7EYnhgtLRSN1nYSS5p5USBZBDXDopCQmYfRk91ZzCoyt"; // 43-char base58-ish
  it("accepts plausible base58 addresses", () => {
    expect(isSolanaAddress(valid)).toBe(true);
    expect(validateAddress(valid).ok).toBe(true);
  });
  it("rejects zero chars and non-base58", () => {
    expect(isSolanaAddress("")).toBe(false);
    expect(isSolanaAddress("0OIl-invalid-address-0000000000000000000000")).toBe(false);
    expect(isSolanaAddress("short")).toBe(false);
  });
  it("rejects whitespace-only and injection-ish input", () => {
    expect(validateAddress("   ").ok).toBe(false);
    expect(validateAddress("abc; drop table").ok).toBe(false);
  });
});

describe("formatters", () => {
  it("formats USD compactly", () => {
    expect(fmtUsd(1_820_000)).toBe("$1.8M");
    expect(fmtUsd(182_000)).toBe("$182K");
  });
  it("shortens addresses", () => {
    const a = "ABCDEFGHJKLMNPQRSTUV".repeat(3);
    expect(shortAddr(a)).toMatch(/^ABCD…STUV$/);
    expect(shortAddr("abc")).toBe("abc");
  });
  it("formats seconds as mm:ss", () => {
    expect(fmtSeconds(4)).toBe("00:04");
    expect(fmtSeconds(61)).toBe("01:01");
  });
});

describe("input sanitization", () => {
  it("strips control characters and clamps length", () => {
    const dirty = "why\u0000 is\u0007 this token pumping? " + "x".repeat(600);
    const clean = sanitizePrompt(dirty);
    expect(clean).not.toMatch(/[\u0000-\u0008]/);
    expect(clean.length).toBeLessThanOrEqual(500);
  });
  it("trims queries", () => {
    expect(sanitizeQuery("  DOGAI  ")).toBe("DOGAI");
  });
});

describe("error normalization", () => {
  it("keeps DataUnavailableError messages with their env remedy", () => {
    const err = new DataUnavailableError("Holder analytics unavailable.", ["BIRDEYE_API_KEY"]);
    expect(toUserFacingError(err)).toBe("Holder analytics unavailable.");
    expect(err.requiredEnv).toEqual(["BIRDEYE_API_KEY"]);
  });
  it("normalizes upstream HTTP failures to the busy message", () => {
    expect(toUserFacingError(new Error("BIRDEYE returned HTTP 429"))).toMatch(/busy/i);
    expect(toUserFacingError(new Error("fetch failed"))).toMatch(/busy/i);
  });
});
