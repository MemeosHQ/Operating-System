import Link from "next/link";
import { DATA_MODE } from "@/lib/config";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroConsole, LiveStrip } from "@/components/landing/hero-console";
import { HeroSignals } from "@/components/landing/hero-signals";
import { AttentionSection, NarrativesSection } from "@/components/landing/landing-narratives";
import { DnaSection, WalletSection, LaunchesSection, AiSection } from "@/components/landing/landing-features";
import {
  ProblemSection,
  SignalFlowSection,
  EcosystemSection,
  CredibilitySection,
  FinalCta,
  SiteFooter,
} from "@/components/landing/landing-story";
import { ProductPreview } from "@/components/landing/product-preview";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 48% 42% at 18% 8%, rgba(123,97,255,0.09), transparent), radial-gradient(ellipse 40% 38% at 82% 30%, rgba(56,189,248,0.06), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-32 md:pt-40 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div>
            <div
              className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.3em] text-faint"
              style={{ animation: "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" />
              {DATA_MODE === "live" ? "solana live" : "demo mode"}
              <span className="h-px w-10 bg-edge2" />
              $MEMEOS
            </div>
            <h1
              className="mt-6 text-[44px] font-bold leading-[1.04] tracking-tight text-ink md:text-[62px]"
              style={{ animation: "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.08s" }}
            >
              The Operating System
              <br />
              for{" "}
              <span className="bg-gradient-to-r from-accent-soft via-signal to-up bg-clip-text text-transparent">
                Solana Memes.
              </span>
            </h1>
            <p
              className="mt-7 max-w-xl text-[15px] leading-relaxed text-muted"
              style={{ animation: "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.16s" }}
            >
              MEMEOS transforms Solana&apos;s rapidly moving meme economy into an
              intelligence layer for discovering attention, narratives, wallets and
              launches.
            </p>
            <div
              className="mt-9 flex flex-wrap items-center gap-3"
              style={{ animation: "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.24s" }}
            >
              <Link
                href="/terminal"
                className="rounded-lg bg-accent px-8 py-3.5 text-[13px] font-bold tracking-[0.12em] text-white shadow-[0_0_40px_rgba(123,97,255,0.35)] transition-all hover:bg-accent-soft hover:shadow-[0_0_52px_rgba(123,97,255,0.5)]"
              >
                ENTER MEMEOS
              </Link>
              <Link
                href="/live"
                className="rounded-lg border border-edge2 bg-surface/70 px-8 py-3.5 text-[13px] font-bold tracking-[0.12em] text-ink backdrop-blur transition-colors hover:border-signal/50 hover:text-signal"
              >
                EXPLORE LIVE
              </Link>
            </div>
            <div
              className="mt-10"
              style={{ animation: "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.34s" }}
            >
              <HeroSignals />
            </div>
          </div>
          <div
            className="lg:pl-4"
            style={{ animation: "fade-up 0.9s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.2s" }}
          >
            <HeroConsole />
          </div>
        </div>
      </section>

      <LiveStrip />

      {/* ── STORY ── */}
      <ProblemSection />
      <ProductPreview />
      <AttentionSection />
      <DnaSection />
      <WalletSection />
      <NarrativesSection />
      <LaunchesSection />
      <AiSection />
      <SignalFlowSection />
      <EcosystemSection />
      <CredibilitySection />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
