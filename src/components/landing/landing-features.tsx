"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import type { DnaProfile, Launch, TokenMetrics } from "@/lib/types";
import { cn, fmtSeconds } from "@/lib/utils";
import { Reveal } from "./reveal";
import { SectionHeading } from "./landing-narratives";

/** MEME DNA + WALLET INTELLIGENCE + LAUNCH REPLAY + AI landing sections. */

/** DNA — "EVERY MEME HAS A FINGERPRINT." — real DNA engine bars that build in. */
export function DnaSection() {
  const { data: tokens } = useApi<TokenMetrics[]>("/api/tokens");
  const sample =
    (tokens ?? []).find((t) => (t.attentionVelocity ?? 0) > 55) ?? tokens?.[0];
  const { data: dna } = useApi<DnaProfile>(
    sample ? `/api/dna/${sample.address}` : "/api/dna?q=none"
  );
  const dims = (dna?.dimensions ?? []).slice(0, 5);

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading eyebrow="Meme DNA" title="EVERY MEME HAS A FINGERPRINT." />
      <div className="grid items-center gap-12 md:grid-cols-2">
        <Reveal>
          <div className="glass rounded-2xl border border-edge2 p-7">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[15px] font-bold text-ink">
                {dna ? `$${dna.token.ticker}` : "···"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                genome profile
              </span>
            </div>
            <div className="mt-6 space-y-5">
              {dims.length === 0
                ? [0, 1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-9 rounded-lg" />)
                : dims.map((d) => (
                    <div key={d.key} title={d.basis}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12px] font-medium text-muted">{d.label}</span>
                        <span className="font-mono text-[12px] tabular-nums text-ink">{d.score}</span>
                      </div>
                      <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-edge/70">
                        <div
                          className={cn(
                            "bar-grow h-full rounded-full",
                            d.score >= 60
                              ? "bg-gradient-to-r from-up/70 to-up"
                              : d.score >= 30
                                ? "bg-gradient-to-r from-signal/70 to-signal"
                                : "bg-gradient-to-r from-warn/70 to-warn"
                          )}
                          style={{ width: `${Math.max(3, d.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
            </div>
            <p className="mt-6 border-t border-edge pt-4 text-[11.5px] leading-relaxed text-faint">
              Eight evidence-backed dimensions. Every score ships with its calculation
              basis — hover any bar to read it.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h3 className="text-[20px] font-bold leading-snug tracking-tight text-ink md:text-[24px]">
            A fingerprint, not a price chart.
          </h3>
          <p className="mt-5 text-[14px] leading-relaxed text-muted">
            MEMEOS reads a token&apos;s attention, holder quality, liquidity, smart-money
            presence, community, creator behavior, bot activity and momentum as one
            genome — and shows how it evolves.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            The same lens applies to every token in the ecosystem, so comparisons are
            honest and every number is explainable.
          </p>
          <Link href="/dna" className="mt-7 inline-block text-[12px] text-signal hover:underline">
            Sequence a token&apos;s DNA →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** WALLET INTELLIGENCE — flowing SVG connections that draw themselves. */
export function WalletSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading eyebrow="Wallet Intelligence" title="SEE WHO IS MOVING." />
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 md:p-10">
          <svg viewBox="0 0 640 230" className="h-auto w-full" role="img" aria-label="Wallet to token signal flow">
            <defs>
              <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#7b61ff" stopOpacity="0.15" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M 90 ${38 + i * 52} C 240 ${20 + i * 58}, 360 ${16 + i * 64}, 520 ${70 + i * 32}`}
                fill="none"
                stroke="url(#flow)"
                strokeWidth="1.1"
                strokeDasharray="5 7"
                className="flow-draw"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <g key={`w${i}`}>
                <circle cx="90" cy={38 + i * 52} r="9" fill="rgba(123,97,255,0.14)" stroke="#7b61ff" strokeWidth="1" />
                <text x="90" y={62 + i * 52} textAnchor="middle" fill="#586069" fontSize="8" fontFamily="ui-monospace, monospace">
                  WALLET
                </text>
              </g>
            ))}
            <g>
              <circle cx="520" cy="118" r="15" fill="rgba(47,211,138,0.10)" stroke="#2fd38a" strokeWidth="1.2" />
              <text x="520" y="152" textAnchor="middle" fill="#2fd38a" fontSize="9" fontFamily="ui-monospace, monospace">
                $TOKEN
              </text>
            </g>
            <g>
              <rect x="278" y="98" width="84" height="34" rx="8" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.4)" />
              <text x="320" y="119" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="ui-monospace, monospace">
                NARRATIVE
              </text>
            </g>
          </svg>
          <p className="mt-4 text-[12px] leading-relaxed text-faint">
            Observable wallet behavior with transparent labels — EARLY ENTRY, HIGH
            ACTIVITY, LAUNCH PARTICIPANT. Never an unearned verdict.
          </p>
          <Link href="/wallets" className="mt-4 inline-block text-[12px] text-signal hover:underline">
            Explore wallet intelligence →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** LAUNCH REPLAY — real first-60-second events as a premium horizontal timeline. */
export function LaunchesSection() {
  const { data: launches, loading } = useApi<Launch[]>("/api/launches");
  const withEvents = (launches ?? []).find((l) => (l.events?.length ?? 0) > 0);
  const events = (withEvents?.events ?? []).slice(0, 8);

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading eyebrow="Launch Replay" title="WATCH MEMES BEING BORN." />
      {loading || !withEvents ? (
        <div className="signal-line h-24 rounded-2xl border border-edge bg-surface" />
      ) : (
        <Reveal>
          <div className="rounded-2xl border border-edge bg-surface p-6 md:p-9">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[17px] font-bold text-ink">{withEvents.ticker}</span>
              <span className="text-[13px] text-muted">{withEvents.name}</span>
              <span className="rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-signal">
                first 60 seconds
              </span>
            </div>
            <div className="relative mt-10">
              <div className="absolute left-0 right-0 top-[5px] h-px bg-edge2" />
              <div className="relative flex justify-between">
                {events.map((e, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / Math.max(1, events.length)}%` }}
                  >
                    <span
                      className={cn(
                        "relative z-10 h-[11px] w-[11px] rounded-full border-2",
                        e.kind === "whale" || e.kind === "smart-wallet"
                          ? "border-signal bg-signal/30 shadow-[0_0_12px_rgba(56,189,248,0.55)]"
                          : e.kind === "graduation"
                            ? "border-up bg-up/30"
                            : "border-accent bg-accent/20"
                      )}
                    />
                    <span className="mt-2.5 font-mono text-[10px] tabular-nums text-faint">
                      {fmtSeconds(e.tSeconds)}
                    </span>
                    <span className="mt-1 max-w-[100px] text-center text-[10.5px] leading-tight text-muted">
                      {e.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-8 text-[12px] text-faint">
              Full scrubbable replay inside MEMEOS →{" "}
              <Link href="/launches" className="text-signal hover:underline">
                /launches
              </Link>
            </p>
          </div>
        </Reveal>
      )}
    </section>
  );
}

/** AI — elegant command interface, native to MEMEOS (not a chat clone). */
export function AiSection() {
  const questions = [
    "Why is $DOGAI moving?",
    "What narrative is accelerating?",
    "Show unusual wallet activity.",
    "Analyze this launch.",
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading eyebrow="✦ MemeOS Analyst" title="ASK THE MEME ECONOMY." />
      <Reveal>
        <div className="glass overflow-hidden rounded-2xl border border-edge2">
          <div className="flex items-center gap-3 border-b border-edge bg-surface2/60 px-5 py-3">
            <span className="ai-glow flex h-6 w-6 items-center justify-center rounded-md border border-accent/40 bg-accent/10 font-mono text-[12px] text-accent-soft">
              ✦
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              memeos ai
            </span>
          </div>
          <div className="px-5 py-6 md:px-7">
            <div className="flex items-center gap-3 font-mono text-[14px]">
              <span className="text-signal">›</span>
              <span className="text-ink">What do you want to understand?</span>
              <span className="caret-blink text-signal" aria-hidden>
                ▍
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {questions.map((q) => (
                <Link
                  key={q}
                  href="/ai"
                  className="rounded-full border border-edge2 bg-surface2/60 px-4 py-2 text-[12px] text-muted transition-all duration-150 hover:border-signal/50 hover:bg-signal/10 hover:text-signal"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-edge px-5 py-4 text-[11.5px] leading-relaxed text-faint md:px-7">
            The Analyst answers only from data inside MEMEOS and labels every statement
            as OBSERVED, CALCULATED or INTERPRETATION. It never invents on-chain activity.
          </div>
        </div>
      </Reveal>
    </section>
  );
}
