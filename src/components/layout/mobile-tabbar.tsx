"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Home, Radio, Activity, Dna, Search, LayoutGrid, X } from "lucide-react";
import { useApp } from "@/lib/providers/app-provider";
import { cn } from "@/lib/utils";

/**
 * Mobile command navigation — Home · Live · Attention · DNA · Search,
 * plus an expandable "More" sheet for the remaining destinations.
 * Native app feel, not a shrunken desktop.
 */

const TABS = [
  { href: "/terminal", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/attention", label: "Attention", icon: Activity },
  { href: "/dna", label: "DNA", icon: Dna },
] as const;

const MORE = [
  { href: "/wallets", label: "Wallets" },
  { href: "/narratives", label: "Narratives" },
  { href: "/creators", label: "Creators" },
  { href: "/agents", label: "Agents" },
  { href: "/launches", label: "Launches" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/ai", label: "✦ MEMEOS AI" },
  { href: "/settings", label: "Settings" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { setSearchOpen } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-edge pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary mobile"
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
                active ? "text-signal" : "text-faint"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
              {active && (
                <span className="absolute -top-px h-0.5 w-8 rounded-full bg-signal shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-faint transition-colors"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={1.8} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Search</span>
        </button>
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
            moreOpen ? "text-accent-soft" : "text-faint"
          )}
          aria-label="More destinations"
          aria-expanded={moreOpen}
        >
          <LayoutGrid size={18} strokeWidth={1.8} />
          <span className="text-[9px] font-medium uppercase tracking-wider">More</span>
        </button>
      </nav>

      {/* More sheet — remaining destinations */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-void/70 backdrop-blur-sm" />
          <div
            className="glass rise-in absolute inset-x-3 bottom-[72px] rounded-2xl border border-edge2 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="More destinations"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
                MEMEOS · everything else
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="text-faint transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {MORE.map((m) => {
                const active = pathname.startsWith(m.href);
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-[12px] transition-colors",
                      active
                        ? "border-signal/50 bg-signal/10 text-signal"
                        : "border-edge2 text-muted hover:border-edge2 hover:text-ink"
                    )}
                  >
                    {m.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
