/**
 * Centralized error normalization.
 *
 * Unexpected technical failures (RPC errors, HTTP 4xx/5xx, network failures,
 * malformed responses) surface to users as a calm, honest message — never a
 * blank screen. Expected configuration gaps surface with the exact remedy.
 */

export const BUSY_MESSAGE = "Data source is busy. Please try again in a moment.";

/** Thrown by providers when a capability needs infrastructure that isn't configured. */
export class DataUnavailableError extends Error {
  constructor(
    reason: string,
    public requiredEnv?: string[]
  ) {
    super(reason);
    this.name = "DataUnavailableError";
  }
}

export function toUserFacingError(err: unknown): string {
  if (err instanceof DataUnavailableError) return err.message;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /HTTP 4[0-9][0-9]|HTTP 5[0-9][0-9]|unreachable|abort|fetch failed|network|timed?\s?out/i.test(
    message
  )
    ? BUSY_MESSAGE
    : message || BUSY_MESSAGE;
}

export function diagError(scope: string, err: unknown): void {
  try {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.debug(`[memeos:${scope}]`, detail);
  } catch {
    /* diagnostics must never break the flow */
  }
}
