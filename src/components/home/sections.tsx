"use client";

import Link from "next/link";
import { MemeosMark } from "@/components/brand/memeos-logo";
import { useApi } from "@/lib/hooks/use-api";

interface HealthLike {
  data?: { llm?: string };
}

/**
 * FEATURE STORY — six editorial sections, one per real capability, each
 * linking into the actual product route. No cards: oversized numerals,
 * editorial headings, live product state pulled from real APIs.
 */

const CHAPTERS = [
  {
    n: "01",
    title: "See where attention is moving.",
    body: "Attention is measured against each token's own baseline — volume, buyers and transaction acceleration — so a fresh launch and an established token are judged by the same standard: change, not size.",
    href: "/attention",
    cta: "OPEN ATTENTION",
  },
  {
    n: "02",
    title: "Look beneath the surface.",
    body: "Meme DNA profiles every token across eight documented dimensions. Each score carries its calculation basis — and anything that is a proxy says so.",
    href: "/dna",
    cta: "OPEN MEME DNA",
  },
  {
    n: "03",
    title: "Follow the behavior behind the market.",
    body: "Parsed on-chain activity, transparent labels, and a wallet graph built only from observed evidence. MEMEOS describes behavior — it never guesses who someone is.",
    href: "/wallets",
    cta: "OPEN WALLETS",
  },
  {
    n: "04",
    title: "Understand the themes moving through the market.",
    body: "Narratives are ranked by real momentum — today's aggregates versus a previous observed window. When history is still building, MEMEOS says so instead of inventing a number.",
    href: "/narratives",
    cta: "OPEN NARRATIVES",
  },
  {
    n: "05",
    title: "Study the first moments.",
    body: "Every launch's first 60 seconds are reconstructed from observed on-chain events: the first buyers, the whales, the acceleration — replayable, not imagined.",
    href: "/launches",
    cta: "OPEN LAUNCH REPLAY",
  },
  {
    n: "06",
    title: "Ask the intelligence layer.",
    body: "The MemeOS Analyst answers questions strictly from MEMEOS data — every statement labeled observed, calculated, or interpretation. When the LLM is unavailable, the deterministic rule engine answers and says so.",
    href: "/ai",
    cta: "OPEN THE ANALYST",
  },
];

export function FeatureStory() {
  const { data: health } = useApi<HealthLike>("/api/health", { refreshMs: 60_000 });
  const geminiLive = health?.data?.llm === "gemini-live";
  const aiProvider = geminiLive
    ? "Gemini is active — answers reasoned over live MEMEOS context."
    : "Rule engine active — deterministic answers over live MEMEOS context. Gemini activates when quota allows.";

  return (
    <>
      {CHAPTERS.map((c) => (
        <section
          key={c.n}
          className="mx-auto max-w-7xl border-t border-edge px-5 py-24 md:py-32"
        >
          <div className="grid gap-10 lg:grid-cols-[140px_1fr] lg:gap-16">
            <div className="font-mono text-[64px] font-bold leading-none tracking-tight text-edge2/80 md:text-[96px]">
              {c.n}
            </div>
            <div className="max-w-2xl">
              <h2 className="text-[30px] font-bold leading-[1.04] tracking-tight text-ink md:text-[44px]">
                {c.title}
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">{c.body}</p>
              <Link
                href={c.href}
                className="mt-7 inline-block font-mono text-[11px] uppercase tracking-[0.28em] text-accent-soft transition-colors hover:text-signal"
              >
                {c.cta} →
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* AI STATUS — real provider state, honestly labeled */}
      <section className="mx-auto max-w-7xl border-t border-edge px-5 pb-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
          <MemeosMark height={13} />
          <span>Analyst engine status</span>
          <span
            className={geminiLive ? "text-live" : "text-muted"}
          >
            ● {geminiLive ? "Gemini live" : "Rule engine (Gemini quota-gated)"}
          </span>
          <span className="normal-case tracking-normal">{aiProvider}</span>
        </div>
      </section>
    </>
  );
}

/**
 * FINAL CTA � the meme is the surface, the signal is underneath.
 * Uses the real wallet-gate flow (terminal -> connect -> terminal).
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-36 text-center md:py-48">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-accent/[0.07] blur-[120px]" />
      </div>
      <div className="relative">
        <h2 className="mx-auto max-w-4xl text-[36px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[60px]">
          THE MEME IS THE SURFACE.
          <br />
          <span className="text-muted">THE SIGNAL IS UNDERNEATH.</span>
        </h2>
        <Link
          href="/terminal"
          className="mt-12 inline-block rounded-lg bg-accent px-10 py-4 text-[13px] font-bold tracking-[0.14em] text-white shadow-[0_0_44px_rgba(123,97,255,0.4)] transition-all hover:bg-accent-soft"
        >
          ENTER MEMEOS
        </Link>
        <p className="mt-8 font-mono text-[9.5px] uppercase tracking-[0.3em] text-faint">
          Read-only � wallet-gated � no signatures required
        </p>
      </div>
      <footer className="mt-32 border-t border-edge">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
            MEMEOS - The Intelligence Layer for Solana Memes
          </span>
          <nav className="flex gap-6 text-[12px] text-muted">
            <Link href="/narratives" className="hover:text-ink">Narratives</Link>
            <Link href="/dna" className="hover:text-ink">DNA</Link>
            <Link href="/launches" className="hover:text-ink">Launches</Link>
            <Link href="/ai" className="hover:text-ink">Analyst</Link>
          </nav>
        </div>
      </footer>
    </section>
  );
}
