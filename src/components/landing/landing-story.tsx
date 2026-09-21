import Link from "next/link";
import { Reveal } from "./reveal";
import { TokenContractBar } from "@/components/token-contract-bar";
import { MemeosWordmark } from "@/components/brand/memeos-logo";

/** LANDING 3.0 editorial sections — problem, signal flow, ecosystem, credibility, CTA, footer. */

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <Reveal>
        <h2 className="max-w-4xl text-[30px] font-bold leading-[1.12] tracking-tight text-ink md:text-[46px]">
          The meme economy moves faster
          <br />
          <span className="text-faint">than human attention.</span>
        </h2>
        <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-muted">
          Thousands of tokens, wallets, creators and narratives move through Solana every
          day. MEMEOS connects those signals into one intelligence layer.
        </p>
      </Reveal>
      <Reveal delay={140}>
        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-edge pt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
          <span>attention</span>
          <span>wallets</span>
          <span>narratives</span>
          <span>launches</span>
          <span>dna</span>
        </div>
      </Reveal>
    </section>
  );
}

export function SignalFlowSection() {
  const steps = ["TOKEN", "WALLET", "NARRATIVE", "ATTENTION", "MEMEOS"];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <div className="mb-8 font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
          See the signal
        </div>
        <div className="flex flex-wrap items-center gap-y-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={
                  i === steps.length - 1
                    ? "rounded-lg border border-signal/50 bg-signal/10 px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.22em] text-signal glow-signal"
                    : "rounded-lg border border-edge2 bg-surface px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.22em] text-muted"
                }
              >
                {s}
              </div>
              {i < steps.length - 1 && (
                <div className="signal-line h-px w-8 bg-edge2 md:w-14" aria-hidden />
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-lg text-[13px] leading-relaxed text-muted">
          Tokens, wallets, narratives and attention aren&apos;t separate dashboards in
          MEMEOS — they are one connected signal.
        </p>
      </Reveal>
    </section>
  );
}

export function EcosystemSection() {
  const branches = ["TOKENS", "WALLETS", "NARRATIVES", "CREATORS", "AGENTS", "LAUNCHES"];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
          The ecosystem
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-8 py-4 font-mono text-[13px] font-bold tracking-[0.3em] text-ink glow-accent">
            MEMEOS
          </div>
          <div className="h-7 w-px bg-edge2" aria-hidden />
          <div className="h-px w-full max-w-3xl bg-edge2" aria-hidden />
          <div className="grid w-full max-w-3xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {branches.map((b) => (
              <div key={b} className="flex flex-col items-center">
                <div className="h-5 w-px bg-edge2" aria-hidden />
                <div className="mt-1 rounded-lg border border-edge2 bg-surface px-3 py-2.5 text-center font-mono text-[9.5px] tracking-[0.16em] text-muted transition-colors hover:border-signal/40 hover:text-signal">
                  {b}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-md text-center text-[13px] leading-relaxed text-muted">
          One system observing every layer of the meme economy — and the attention
          connecting them.
        </p>
      </Reveal>
    </section>
  );
}

const CAPABILITIES: { title: string; body: string }[] = [
  { title: "REAL-TIME INTELLIGENCE", body: "Attention velocity, momentum and lifecycle computed continuously over live market data." },
  { title: "WALLET GRAPH", body: "Observable wallet behavior with transparent labels — never an unearned verdict." },
  { title: "NARRATIVE DETECTION", body: "Emerging themes detected from token clusters, launches and attention movement." },
  { title: "MEME DNA", body: "An eight-dimension evidence-backed profile for every token, each score with its basis." },
  { title: "LAUNCH ANALYTICS", body: "First-60-second launch replay — buyers, whales and momentum, event by event." },
  { title: "AI ANALYSIS", body: "The Analyst answers only from data inside MEMEOS, labeling every statement." },
];

export function CredibilitySection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <h2 className="max-w-3xl text-[26px] font-bold leading-tight tracking-tight text-ink md:text-[34px]">
          Built for the next era of
          <br />
          on-chain attention.
        </h2>
      </Reveal>
      <Reveal delay={120}>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="bg-surface p-6 transition-colors hover:bg-surface2/70">
              <div className="font-mono text-[11px] font-semibold tracking-[0.2em] text-ink">{c.title}</div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />
      </div>
      <Reveal className="relative">
        <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-faint">MEMEOS</div>
        <h2 className="mx-auto mt-5 max-w-2xl text-[30px] font-bold leading-tight tracking-tight text-ink md:text-[42px]">
          The Solana meme economy,
          <br />
          understood.
        </h2>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.26em] text-faint">
          follow attention · understand the signal · explore the ecosystem
        </p>
        <Link
          href="/terminal"
          className="mt-10 inline-block rounded-lg bg-accent px-9 py-3.5 text-[13px] font-bold tracking-[0.12em] text-white shadow-[0_0_40px_rgba(123,97,255,0.35)] transition-all hover:bg-accent-soft hover:shadow-[0_0_50px_rgba(123,97,255,0.5)]"
        >
          ENTER MEMEOS
        </Link>
        {/* $MEMEOS token contract bar — sits below the primary CTA */}
        <div className="mx-auto mt-16 max-w-4xl text-left">
          <TokenContractBar />
        </div>
      </Reveal>
    </section>
  );
}

const FOOTER_LINKS = [
  { href: "/terminal", label: "Terminal" },
  { href: "/live", label: "Live" },
  { href: "/attention", label: "Attention" },
  { href: "/dna", label: "DNA" },
  { href: "/wallets", label: "Wallets" },
  { href: "/narratives", label: "Narratives" },
  { href: "/agents", label: "Agents" },
  { href: "/launches", label: "Launches" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <MemeosWordmark height={12} />
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-muted">
              The Operating System for Solana Memes.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-2.5 sm:grid-cols-4">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[12px] text-muted transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-6 text-[11px] text-faint">
          <span>Intelligence, not advice. DYOR.</span>
          <TokenContractBar variant="compact" />
          <span>Read-only platform — MEMEOS never signs transactions.</span>
        </div>
      </div>
    </footer>
  );
}
