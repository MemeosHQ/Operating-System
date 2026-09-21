import "server-only";

/**
 * SERVER-ONLY credential configuration — the single place private env vars are
 * read. Never import from client components. Every secret here stays on the
 * server; nothing is ever exposed through NEXT_PUBLIC_*.
 */

export type ProviderStatus = "configured" | "unconfigured";

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/** Data mode resolution — MEMEOS_DEMO_MODE=true|false wins, then NEXT_PUBLIC_DATA_MODE. */
export function resolveDataMode(): "demo" | "live" {
  const flag = read("MEMEOS_DEMO_MODE").toLowerCase();
  if (flag === "true") return "demo";
  if (flag === "false") return "live";
  const next = read("NEXT_PUBLIC_DATA_MODE").toLowerCase();
  return next === "live" ? "live" : "demo";
}

export const HELIUS_API_KEY = read("HELIUS_API_KEY");
export const BIRDEYE_API_KEY = read("BIRDEYE_API_KEY");
export const GEMINI_API_KEY = read("GEMINI_API_KEY");
export const OPENAI_API_KEY = read("OPENAI_API_KEY");
export const ANTHROPIC_API_KEY = read("ANTHROPIC_API_KEY");
export const DATABASE_URL = read("DATABASE_URL");

export function heliusConfigured(): boolean {
  return HELIUS_API_KEY.length > 0;
}

export function birdeyeConfigured(): boolean {
  return BIRDEYE_API_KEY.length > 0;
}

export function databaseConfigured(): boolean {
  return DATABASE_URL.length > 0;
}

export function llmProviderName(): "gemini" | "openai" | "anthropic" | null {
  if (GEMINI_API_KEY) return "gemini";
  if (OPENAI_API_KEY) return "openai";
  if (ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

/** One-time startup validation log — surfaces misconfiguration without spamming. */
let validated = false;
export function validateServerEnv(): void {
  if (validated) return;
  validated = true;
  const mode = resolveDataMode();
  const lines: string[] = [`[memeos:env] data mode: ${mode}`];
  if (mode === "live") {
    if (!heliusConfigured()) {
      lines.push("[memeos:env] WARNING: live mode without HELIUS_API_KEY — wallet intelligence and launch replay degrade to honest unavailable states.");
    }
    if (!birdeyeConfigured()) {
      lines.push("[memeos:env] note: BIRDEYE_API_KEY not set — DNA holder quality uses a labeled market-cap proxy.");
    }
    if (!databaseConfigured()) {
      lines.push("[memeos:env] note: DATABASE_URL not set — snapshot history and server watchlists are unavailable.");
    }
    if (!llmProviderName()) {
      lines.push("[memeos:env] note: no LLM key — the Analyst runs as the deterministic rule engine (no key needed).");
    }
  }
  console.log(lines.join("\n"));
}
