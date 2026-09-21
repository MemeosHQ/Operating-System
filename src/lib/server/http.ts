import "server-only";

/**
 * Bounded HTTP JSON fetch with timeout + limited retries + telemetry.
 * Adapted from the proven PumpEye server client.
 */

export class UpstreamError extends Error {
  constructor(
    public service: string,
    message: string
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

interface HttpOptions {
  retries?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function httpJson<T>(
  service: string,
  url: string,
  init: RequestInit = {},
  { retries = 1, timeoutMs = 10_000, headers }: HttpOptions = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { accept: "application/json", ...headers, ...(init.headers ?? {}) },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new UpstreamError(service, `${service} returned HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  const detail =
    lastErr instanceof Error ? lastErr.message : "unknown network failure";
  throw new UpstreamError(service, `${service} unreachable: ${detail}`);
}
