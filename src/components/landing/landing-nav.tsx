"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MemeosMark, MemeosWordmark } from "@/components/brand/memeos-logo";

const LINKS = [
  { href: "/narratives", label: "Narratives" },
  { href: "/dna", label: "DNA" },
  { href: "/wallets", label: "Wallets" },
  { href: "/ai", label: "✦ AI" },
];

/** Floating, centered, scroll-compacting navigation. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Primary"
        className={cn(
          "flex items-center rounded-full border border-edge2 bg-void/70 backdrop-blur-xl transition-all duration-300",
          scrolled
            ? "gap-1 px-3 py-2 shadow-[0_10px_44px_rgba(0,0,0,0.6)]"
            : "gap-1.5 px-4 py-2.5"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            scrolled ? "scale-[0.96]" : ""
          )}
        >
          <MemeosMark height={13} />
          <MemeosWordmark height={scrolled ? 10 : 11} />
        </Link>
        <span className="mx-1.5 h-4 w-px bg-edge2" aria-hidden />
        <div className="hidden items-center sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-[12px] text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/terminal"
          className="ml-1 rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white shadow-[0_0_24px_rgba(123,97,255,0.35)] transition-all duration-200 hover:bg-accent-soft hover:shadow-[0_0_30px_rgba(123,97,255,0.5)]"
        >
          ENTER TERMINAL
        </Link>
      </nav>
    </header>
  );
}
