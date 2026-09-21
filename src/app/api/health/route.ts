import "server-only";
import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/server/cache";
import { getProviders } from "@/lib/services";
import { rpcHealthy } from "@/lib/services/live/rpc";
import { heliusHealthy } from "@/lib/services/live/helius";
import { probeDexscreener, probePumpfun } from "@/lib/server/probes";
import { dbHealthy } from "@/lib/server/db";
import { heliusConfigured, GEMINI_API_KEY } from "@/lib/server/env";
import { probeGemini, GEMINI_MODEL } from "@/lib/ai/gemini";
import { upstreamAgeSeconds } from "@/lib/server/freshness";
import type { HealthReport } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Cached real Gemini probe — long TTL so health checks never burn the
 * daily free-tier quota (gemini-3.8-flash: ~20 req/day on Free Tier). */
const llmProbe = async (): Promise<HealthReport["llm"]> => {
  if (!GEMINI_API_KEY) return "unconfigured";
  return cached("health:llm-probe", TTL.XLONG, async () => ((await probeGemini()) ? "gemini-live" : "degraded"));
};

/**
 * REAL health endpoint — probes each upstream with short timeouts and caches
 * results briefly so the status bar never spams upstreams. Never reports
 * "live" unless the checks actually pass. Unconfigured providers are reported
 * as "unconfigured", never as healthy. lastUpdateSeconds reflects the real age
 * of the last successful upstream market fetch (-1 when never fetched).
 */
export async function GET() {
  const report = await cached("health:report", TTL.SHORT, async (): Promise<HealthReport> => {
    const mode = getProviders().mode;
    const [rpcOk, dexscreener, pumpfun, heliusOk, dbOk, llm] = await Promise.all([
      rpcHealthy(),
      probeDexscreener(),
      probePumpfun(),
      heliusHealthy(),
      dbHealthy(),
      llmProbe(),
    ]);

    return {
      rpc: rpcOk ? "connected" : "down",
      data: mode === "live" ? "live" : "demo",
      pumpfun,
      dexscreener,
      helius: heliusConfigured() ? (heliusOk ? "connected" : "down") : "unconfigured",
      ai: "connected", // rule-engine Analyst — answers from in-app data, no key required
      llm,
      llmModel: GEMINI_API_KEY ? GEMINI_MODEL : undefined,
      database: dbOk ? "connected" : "down", // real SELECT 1 probe — never assumed
      lastUpdateSeconds: upstreamAgeSeconds() ?? -1,
      checksAt: Date.now(),
    };
  });
  return NextResponse.json({ ok: true, data: report });
}
