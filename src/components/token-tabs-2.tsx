"use client";

import { useState } from "react";
import type { Launch, AnalystAnswer } from "@/lib/types";
import { Panel, PanelHeader, Badge, Button } from "@/components/ui/kit";
import { EmptyState, LoadingState, ErrorState } from "@/components/ui/states";
import { useApi } from "@/lib/hooks/use-api";
import { LaunchReplay } from "@/components/launch-replay";

/** Secondary token-detail tabs (part 2): Launch replay, AI. */

export function LaunchTab({ address }: { address: string }) {
  const { data, loading, error, requiredEnv, retry } = useApi<Launch>(`/api/launches/${address}`);
  if (loading) return <LoadingState rows={3} label="Loading launch data…" />;
  if (error || !data) {
    return (
      <ErrorState
        message={error ?? "No replay data for this launch — first-60-second streams require indexed launch events."}
        requiredEnv={requiredEnv}
        onRetry={retry}
      />
    );
  }
  if (!data.events || data.events.length === 0) {
    return (
      <EmptyState
        title="No first-minute event stream for this launch"
        hint="Launch replay requires an indexed event source (Helius webhooks + persistent store)."
      />
    );
  }
  return <LaunchReplay launch={data} />;
}

const AI_QUESTIONS = [
  "Why is this token gaining attention?",
  "Who were the earliest notable buyers?",
  "Show me the Meme DNA",
];

export function AiTab({ address }: { address: string }) {
  const [answer, setAnswer] = useState<AnalystAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ask = async (q: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/analyst", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, tokenAddress: address }),
      });
      const json = await res.json();
      if (json.ok) setAnswer(json.data as AnalystAnswer);
      else setErr(json.error ?? "Analyst unavailable.");
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {AI_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={busy}
            className="rounded-full border border-edge2 px-3 py-1 text-[12px] text-muted hover:border-accent hover:text-accent-soft"
          >
            {q}
          </button>
        ))}
      </div>
      {busy && <LoadingState rows={2} label="Analyst thinking…" />}
      {err && <ErrorState message={err} />}
      {answer && !busy && (
        <Panel className="rise-in">
          <PanelHeader title="MemeOS Analyst" sub="Observed · Calculated · Interpretation" />
          <div className="space-y-2 p-4">
            <p className="text-[13px] font-medium text-ink">{answer.text}</p>
            {answer.sections.map((s, i) => (
              <div key={i} className="flex gap-2 text-[12px]">
                <Badge tone={s.kind === "observed" ? "up" : s.kind === "calculated" ? "accent" : "warn"}>
                  {s.kind === "ai-interpretation" ? "interp" : s.kind}
                </Badge>
                <span className="text-muted">{s.label}: {s.value}</span>
              </div>
            ))}
            {answer.chips.length > 0 && (
              <div className="flex gap-1.5 border-t border-edge pt-2">
                {answer.chips.map((c) => (
                  <Button key={c} variant="ghost" onClick={() => ask(c)} className="px-2 text-[12px]">
                    {c}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Panel>
      )}
      {!answer && !busy && !err && (
        <EmptyState title="Ask the analyst" hint="Pick a question above — answers come only from data in this token's profile." />
      )}
    </div>
  );
}
