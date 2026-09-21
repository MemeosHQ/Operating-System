"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalystAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * ✦ MEMEOS AI — floating command access. Opens a compact analyst overlay
 * with suggested questions; answers POST to the same /api/ai/analyst.
 * Not an embedded chatbot — a command surface.
 */

const QUESTIONS = [
  "Why is $DOGAI moving?",
  "What narrative is accelerating?",
  "What's gaining attention?",
  "Show unusual wallet activity.",
];

export function AiQuick() {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<AnalystAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (question: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/analyst", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (json.ok) setAnswer(json.data as AnalystAnswer);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open MEMEOS AI"
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-11 items-center gap-2 rounded-full px-4 font-mono text-[12px] font-bold transition-all md:bottom-6 md:right-6",
          open
            ? "border border-signal/50 bg-signal/15 text-signal glow-signal"
            : "border border-accent/50 bg-accent/15 text-accent-soft shadow-[0_0_24px_rgba(123,97,255,0.35)] hover:bg-accent/25"
        )}
      >
        <span className="text-[14px]">✦</span> AI
      </button>

      {/* Overlay panel */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-void/60 backdrop-blur-sm" />
          <div
            className="glass absolute inset-x-3 bottom-24 max-w-md rounded-2xl border border-edge2 p-5 shadow-2xl md:bottom-24 md:right-6 md:left-auto md:inset-x-auto md:w-[26rem]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="MEMEOS AI command"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
                ✦ MemeOS AI
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-faint transition-colors hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <h3 className="mt-2 text-[16px] font-bold tracking-tight text-ink">
              What do you want to understand?
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => ask(question)}
                  disabled={busy}
                  className="rounded-full border border-edge2 px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-signal/50 hover:text-signal disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-edge pt-3">
              {busy && (
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" /> analyzing…
                </div>
              )}
              {!busy && answer && (
                <div className="rise-in space-y-2">
                  <p className="text-[13px] font-medium text-ink">{answer.text}</p>
                  {answer.sections.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider",
                          s.kind === "observed" ? "text-up" : s.kind === "calculated" ? "text-accent-soft" : "text-warn"
                        )}
                      >
                        {s.kind === "ai-interpretation" ? "interp" : s.kind}
                      </span>
                      <span className="min-w-0 text-muted">
                        {s.label}: {s.value}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/ai"
                    onClick={() => setOpen(false)}
                    className="inline-block pt-1 text-[11px] text-signal hover:underline"
                  >
                    Open full Analyst →
                  </Link>
                </div>
              )}
              {!busy && !answer && (
                <p className="text-[11px] leading-relaxed text-faint">
                  Answers come strictly from data inside MEMEOS — labeled observed,
                  calculated or interpretation. Never invented.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
