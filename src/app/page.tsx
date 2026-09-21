import Image from "next/image";
import Link from "next/link";
import { DATA_MODE } from "@/lib/config";
import { MemeosMark, MemeosWordmark } from "@/components/brand/memeos-logo";
import { LiveIntelligenceStrip } from "@/components/home/live-strip";
import { SignalField } from "@/components/home/signal-field";
import { FeatureStory, FinalCta } from "@/components/home/sections";

export default function HomePage() {
  return (
    <div className="bg-void text-ink">
      <FlagshipHeader />
      <Hero />
      <LiveIntelligenceStrip mode={DATA_MODE} />
      <WhatMemeosSees />
      <FeatureStory />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-28 md:pt-36 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
        <div className="relative z-10">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.42em] text-accent-soft"
            style={{ animation: "fade-up 0.7s 0.05s both" }}
          >
            Solana Meme Intelligence
          </p>
          <h1
            className="mt-6 text-[64px] font-bold leading-[0.92] tracking-[-0.03em] md:text-[92px]"
            style={{ animation: "fade-up 0.7s 0.12s both" }}
          >
            MEMEOS
          </h1>
          <p
            className="mt-4 max-w-md text-[26px] font-semibold leading-[1.08] tracking-tight text-muted md:text-[34px]"
            style={{ animation: "fade-up 0.7s 0.2s both" }}
          >
            The intelligence layer for Solana&nbsp;memes.
          </p>
          <p
            className="mt-7 max-w-sm text-[15px] leading-relaxed text-faint"
            style={{ animation: "fade-up 0.7s 0.28s both" }}
          >
            See what moves. Understand why. MEMEOS turns raw activity across
            the meme economy into signal you can actually read.
          </p>
          <div
            className="mt-10 flex flex-wrap items-center gap-3"
            style={{ animation: "fade-up 0.7s 0.36s both" }}
          >
            <Link
              href="/terminal"
              className="rounded-lg bg-accent px-8 py-3.5 text-[13px] font-bold tracking-[0.12em] text-white shadow-[0_0_36px_rgba(123,97,255,0.35)] transition-all hover:bg-accent-soft"
            >
              ENTER MEMEOS
            </Link>
            <Link
              href="/attention"
              className="rounded-lg border border-edge2 px-7 py-3.5 text-[13px] font-semibold tracking-[0.1em] text-muted transition-colors hover:border-accent hover:text-ink"
            >
              EXPLORE THE INTELLIGENCE
            </Link>
          </div>
        </div>

        <div className="relative lg:-mr-[12%]">
          <div className="relative overflow-hidden rounded-2xl border border-edge">
            <Image
              src="/images/memeos-hero-original.png"
              alt="Abstract MEMEOS intelligence field — signals finding structure inside chaos"
              width={1600}
              height={900}
              priority
              className="h-auto w-full"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)",
              }}
            />
          </div>
        </div>
      </div>
      <SignalField />
    </section>
  );
}

function WhatMemeosSees() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-28 md:py-40">
      <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-faint">
        What MEMEOS sees
      </p>
      <h2 className="mt-8 max-w-4xl text-[44px] font-bold leading-[0.98] tracking-[-0.025em] md:text-[76px]">
        THE MARKET IS LOUD.
        <br />
        <span className="text-muted">THE SIGNAL IS QUIET.</span>
      </h2>
      <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-faint">
        Thousands of tokens, wallets and themes move through Solana every day.
        MEMEOS observes the activity and turns it into intelligence you can act
        on — every number sourced, every score documented.
      </p>

      <div className="mt-16 divide-y divide-edge border-y border-edge">
        {[
          ["Attention", "Where the market is looking right now, measured against each token's own baseline."],
          ["Wallet behavior", "Parsed on-chain activity with observable-behavior labels — never identity claims."],
          ["Narratives", "The themes moving through the market, ranked by real momentum, not vibes."],
          ["Launch activity", "Every new launch archived with its first 60 seconds reconstructable."],
          ["Meme DNA", "Eight documented dimensions beneath every token's surface."],
          ["Historical patterns", "Snapshots over time — momentum needs memory."],
        ].map(([name, desc], i) => (
          <div
            key={name}
            className="group flex items-baseline gap-6 py-5 transition-colors hover:bg-surface2/40"
          >
            <span className="font-mono text-[11px] text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="w-44 shrink-0 text-[16px] font-semibold text-ink">
              {name}
            </span>
            <span className="text-[13px] leading-relaxed text-muted">{desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FlagshipHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge/60 bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="MEMEOS home">
          <MemeosMark height={15} />
          <MemeosWordmark height={11} />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
          <Link href="/terminal" className="transition-colors hover:text-ink">Intelligence</Link>
          <Link href="/narratives" className="transition-colors hover:text-ink">Product</Link>
          <Link href="/ai" className="transition-colors hover:text-ink">Analyst</Link>
          <Link href="/launches" className="transition-colors hover:text-ink">Launches</Link>
        </nav>
        <Link
          href="/terminal"
          className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-[12px] font-semibold tracking-[0.08em] text-accent-soft transition-colors hover:bg-accent/20"
        >
          ENTER MEMEOS
        </Link>
      </div>
    </header>
  );
}
