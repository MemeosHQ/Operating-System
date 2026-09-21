import "server-only";
import type { MemeosProviders } from "./types";
import { DemoProvider } from "./demo/provider";
import { LiveProvider } from "./live/provider";
import { resolveDataMode, validateServerEnv } from "@/lib/server/env";

/**
 * Provider selector — the ONLY place that knows which provider is active.
 * UI and API routes consume `getProviders()` and never the concrete classes.
 * MEMEOS_DEMO_MODE=true|false (server) wins over NEXT_PUBLIC_DATA_MODE.
 */

let instance: MemeosProviders | undefined;

export function getProviders(): MemeosProviders {
  if (!instance) {
    validateServerEnv();
    instance = resolveDataMode() === "live" ? new LiveProvider() : new DemoProvider();
  }
  return instance;
}
