"use client";

import { useState } from "react";
import type { AnalystAnswer, Evidence, TokenMetrics } from "@/lib/types";
import { Panel, PanelHeader, Badge, Button, TokenLogo } from "@/components/ui/kit";
import { useApi } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";
import { MemeosMark } from "@/components/brand/memeos-logo";

const SUGGESTIONS = [
  "What narrative is accelerating?",
  "Why is this token gaining attention?",
  "What changed in the last 10 minutes?",
  "Which narratives are building a baseline?",
  "Explain this token's Meme DNA.",
  "Analyze this wallet.",
];

const KIND_TONE: Record<Evidence["kind"], "up" | "accent" | "warn"> = {
  observed: "up",
  calculated: "accent",
  "ai-interpretation": "warn",
};

interface Turn {
  role: "user" | "analyst";
  text: string;
  answer?: AnalystAnswer;
}

/** MemeOS Analyst — Gemini when configured, rule engine otherwise. Honest engines only. */
export default function AiPage() {
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const { data: health } = useApi<{ llm?: string; data?: string; rpc?: string; database?: string }>(
    "/api/health",
    { refreshMs: 60_000 }
  );
  const [token, setToken] = useState<TokenMetrics | null>(null);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const llm = health?.llm ?? "unconfigured";
  const engineLabel =
    llm === "gemini-live"
      ? "✦ GEMINI ANALYST"
      : llm === "degraded"
        ? "MEMEOS RULE ENGINE · Gemini degraded"
        : "MEMEOS RULE ENGINE";

  const ask = async (q: string, useRuleEngine = false) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/analyst", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: q,
          tokenAddress: token?.address,
          history: turns.slice(-6).map((t) => ({ role: t.role, text: t.text })),
          ...(useRuleEngine ? {} : {}),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        const a = json.data as AnalystAnswer;
        setTurns((prev) => [...prev, { role: "user", text: q }, { role: "analyst", text: a.text, answer: a }]);
      } else {
        setErr(json.error ?? "The analyst is unavailable right now.");
      }
    } catch {
      setErr("Network error — could not reach the analyst.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <MemeosMark height={26} animated />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-ink">MemeOS Analyst</h1>
            <Badge tone={llm === "gemini-live" ? "accent" : "neutral"}>{engineLabel}</Badge>
          </div>
          <p className="text-[13px] text-muted">
            Answers only from live MEMEOS data — {llm === "gemini-live" ? "Gemini reasoning over" : "deterministic rules over"} the canonical intelligence layer.
          </p>
        </div>
      </div>

      {/* LIVE CONTEXT — real health, never hardcoded */}
      <Panel>
        <PanelHeader title="Live MEMEOS data" sub="The analyst answers from these live sources" />
        <div className="flex flex-wrap gap-2 p-3 font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <Badge tone={health?.data === "live" ? "live" : "warn"}>
            {health?.data === "live" ? "● LIVE DATA" : "● DEMO CONTEXT"}
          </Badge>
          <Badge tone={health?.rpc === "connected" ? "live" : "warn"}>Solana {health?.rpc ?? "…"}</Badge>
          <Badge tone={health?.database === "connected" ? "live" : "neutral"}>Database {health?.database ?? "unconfigured"}</Badge>
          <Badge tone={llm === "gemini-live" ? "live" : llm === "degraded" ? "warn" : "neutral"}>
            {llm === "gemini-live" ? "Gemini ● live" : llm === "degraded" ? "Gemini ● degraded" : "Gemini ● rule engine"}
          </Badge>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Context" sub="Optionally scope to a token" />
        <div className="flex flex-wrap gap-1.5 p-3">
          <button
            onClick={() => setToken(null)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[12px]",
              token === null ? "border-accent/60 bg-accent/10 text-accent-soft" : "border-edge2 text-muted hover:text-ink"
            )}
          >
            Global
          </button>
          {(tokens ?? []).slice(0, 6).map((t) => (
            <button
              key={t.address}
              onClick={() => setToken(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[12px]",
                token?.address === t.address
                  ? "border-accent/60 bg-accent/10 text-accent-soft"
                  : "border-edge2 text-muted hover:text-ink"
              )}
            >
              <TokenLogo ticker={t.ticker} url={t.logoUrl} urls={t.logoUrls} size={14} />
              {t.ticker}
            </button>
          ))}
        </div>
      </Panel>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim() && !busy) {
            void ask(question.trim());
            setQuestion("");
          }
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the analyst…"
          className="min-w-0 flex-1 rounded-md border border-edge2 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
        />
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Analyzing…" : "Ask"}
        </Button>
      </form>

      {/* SUGGESTED QUESTIONS — never pre-filled answers */}
      {turns.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void ask(q)}
              disabled={busy}
              className="rounded-full border border-edge2 px-3 py-1 text-[12px] text-muted hover:border-accent hover:text-accent-soft"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 px-1 text-[12px] text-faint">
          <span className="live-dot" /> Analyzing live MEMEOS data…
        </div>
      )}

      {err && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[13px] text-down">
          <span>{err}</span>
          <button
            onClick={() => void ask(question || "What narrative is accelerating?", true)}
            className="rounded-md border border-down/40 px-2 py-0.5 text-[11px] hover:bg-down/20"
          >
            Use MEMEOS Rule Engine
          </button>
        </div>
      )}

      {/* Conversation thread */}
      <div className="space-y-3">
        {turns.map((t, i) =>
          t.role === "user" ? (
            <p key={i} className="px-1 text-right text-[13px] text-muted">
              <span className="rounded-lg bg-surface2 px-3 py-1.5 inline-block text-ink">{t.text}</span>
            </p>
          ) : (
            t.answer && (
              <Panel key={i} className="rise-in">
                <PanelHeader
                  title={t.answer.engine === "gemini" ? "✦ Gemini Analyst" : "MEMEOS Rule Engine"}
                  sub={`Observed · Calculated · Interpretation${t.answer.degraded ? " · Gemini unavailable — rule engine answered" : ""}`}
                />
                <div className="space-y-3 p-4">
                  <div className="space-y-2">
                    {t.answer.sections.map((s, j) => (
                      <div key={j} className="flex items-start gap-2.5 text-[13px]">
                        <Badge tone={KIND_TONE[s.kind]} className="mt-0.5 shrink-0">
                          {s.kind === "ai-interpretation" ? "interpretation" : s.kind}
                        </Badge>
                        <span className="min-w-0">
                          <span className="text-muted">{s.label}: </span>
                          <span className="text-ink">{s.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-edge pt-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                    {t.answer.dataTimestamp && <span>data as of {t.answer.dataTimestamp.slice(11, 19)} UTC</span>}
                    {t.answer.sourceMode && <span>· {t.answer.sourceMode}</span>}
                    {t.answer.dataSources && t.answer.dataSources.length > 0 && (
                      <span>· {t.answer.dataSources.join(" + ")}</span>
                    )}
                  </div>
                  {t.answer.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.answer.chips.map((c) => (
                        <button
                          key={c}
                          onClick={() => void ask(c)}
                          disabled={busy}
                          className="rounded-full border border-edge2 px-3 py-1 text-[12px] text-muted hover:border-accent hover:text-accent-soft"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            )
          )
        )}
      </div>

      <p className="text-[11px] text-faint">
        Labels: observed = raw counters · calculated = deterministic formulas ·
        interpretation = model reading, never a verified fact. The analyst never
        invents on-chain activity and cannot see anything outside MEMEOS data.
      </p>
    </div>
  );
}
