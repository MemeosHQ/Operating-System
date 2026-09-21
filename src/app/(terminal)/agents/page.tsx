"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { AgentProfile } from "@/lib/types";
import { Panel, Badge, AddrLink } from "@/components/ui/kit";
import { StateGate } from "@/components/ui/states";
import { cn, relTime } from "@/lib/utils";

export default function AgentsPage() {
  const { data, loading, error, requiredEnv, retry } = useApi<AgentProfile[]>("/api/agents");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Agents</h1>
        <p className="mt-1 text-[14px] text-muted">
          Wallets whose observable behavior matches bot-like patterns. Identities are
          never fabricated — behavior only.
        </p>
      </div>

      <StateGate
        loading={loading}
        error={error}
        requiredEnv={requiredEnv}
        onRetry={retry}
        isEmpty={(data ?? []).length === 0}
        empty={{ title: "No agents detected" }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((a) => (
            <Panel key={a.address} className="p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-ink">{a.name}</span>
                <Badge tone={a.activity === "HIGH" ? "up" : a.activity === "MEDIUM" ? "accent" : "neutral"}>
                  {a.activity}
                </Badge>
                {a.lastActiveMs && (
                  <span className="ml-auto text-[11px] text-faint">{relTime(a.lastActiveMs)}</span>
                )}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-muted">{a.behavior}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-faint">
                <span>{a.interactionCount} interactions</span>
                <span>{a.launchesInvolved} launches</span>
              </div>
              <div className="mt-3 border-t border-edge pt-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Associated wallet</div>
                <div className="mt-1 flex items-center gap-2">
                  <AddrLink address={a.address} />
                  <Link href={`/wallet/${a.address}`} className="text-[11px] text-accent-soft hover:underline">
                    profile →
                  </Link>
                </div>
              </div>
              {a.tokensTouched.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.tokensTouched.slice(0, 4).map((t) => (
                    <Link key={t} href={`/token/${t}`}>
                      <Badge tone="neutral" className={cn("hover:border-accent")}>
                        token ↗
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          ))}
        </div>
      </StateGate>
    </div>
  );
}
