import { isSolanaAddress } from "@/lib/utils";

/**
 * Address validation for public inputs.
 * Only FORMAT is checked here — existence on-chain is a provider concern.
 */

export type AddressKind = "token" | "wallet" | "unknown";

export interface AddressValidation {
  ok: boolean;
  kind: AddressKind;
  reason?: string;
}

export function validateAddress(input: string): AddressValidation {
  const s = (input ?? "").trim();
  if (!s) return { ok: false, kind: "unknown", reason: "Address is required." };
  if (!isSolanaAddress(s)) {
    return {
      ok: false,
      kind: "unknown",
      reason: "That does not look like a valid Solana address.",
    };
  }
  return { ok: true, kind: "unknown" };
}

/** Basic prompt hygiene for the AI analyst endpoint. */
export function sanitizePrompt(input: string, maxLength = 500) {
  return (input ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Validate a non-empty search query. */
export function sanitizeQuery(input: string, maxLength = 100) {
  return (input ?? "").trim().slice(0, maxLength);
}
