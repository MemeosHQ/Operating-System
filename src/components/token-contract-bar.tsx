"use client";

import { useCallback, useState } from "react";
import { resolveTokenContract } from "@/lib/token-contract";
import { cn } from "@/lib/utils";

/**
 * MEMEOS TOKEN CONTRACT BAR — reusable $MEMEOS contract component.
 *
 * Three honest states:
 *   TBA        → "TBA" shown, copy + buy disabled (nothing invented)
 *   CONFIGURED → short CA, copy / Solscan / buy active
 *   INVALID    → "INVALID CONTRACT", no links, no actions
 *
 * variant="full"    → landing page section
 * variant="compact" → terminal / footer strip
 */

function SolGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M5.4 17.2h11.9l-2.6 2.6H2.8l2.6-2.6Z" fill="currentColor" />
      <path d="M5.4 10.7h11.9l-2.6 2.6H2.8l2.6-2.6Z" fill="currentColor" opacity="0.72" />
      <path d="M5.4 4.2h11.9l-2.6 2.6H2.8l2.6-2.6Z" fill="currentColor" opacity="0.45" />
      <path d="M18.6 6.8l2.6-2.6-2.6-2.6H7l2.6 2.6 -2.6 2.6H18.6Z" fill="currentColor" opacity="0.45" />
      <path d="M18.6 13.3l2.6-2.6-2.6-2.6H7l2.6 2.6 -2.6 2.6h11.6Z" fill="currentColor" opacity="0.72" />
      <path d="M18.6 19.8l2.6-2.6-2.6-2.6H7l2.6 2.6 -2.6 2.6h11.6Z" fill="currentColor" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="m3 8.5 3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TokenContractBar({ variant = "full" }: { variant?: "full" | "compact" }) {
  const info = resolveTokenContract();
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    if (info.state !== "configured" || !info.raw) return;
    void navigator.clipboard?.writeText(info.raw).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => undefined
    );
  }, [info]);

  const compact = variant === "compact";

  /* ── COMPACT variant (terminal / footer) ─────────────────────────────── */
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 rounded-lg border border-edge bg-surface/70 px-3 py-1.5",
          info.state === "configured" && "border-accent/30"
        )}
        title={
          info.state === "tba"
            ? "Official MEMEOS contract address has not been announced yet."
            : info.state === "invalid"
              ? "Configured contract address is not a valid Solana address."
              : info.raw
        }
      >
        <SolGlyph className="h-3.5 w-3.5 text-accent-soft" />
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-muted">
          $MEMEOS
        </span>
        <span className="h-3 w-px bg-edge2" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">CA:</span>
        {info.state === "configured" ? (
          <a
            href={info.solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10.5px] tabular-nums text-ink hover:text-accent-soft"
          >
            {info.short}
          </a>
        ) : info.state === "invalid" ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-warn">invalid</span>
        ) : (
          <span className="font-mono text-[10.5px] font-bold tracking-[0.2em] text-faint">TBA</span>
        )}
        {info.state !== "configured" && (
          <span className="rounded-full border border-edge2 px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">
            coming soon
          </span>
        )}
      </div>
    );
  }

  return <FullBar info={info} copied={copied} onCopy={copy} />;
}

function FullBar({
  info,
  copied,
  onCopy,
}: {
  info: ReturnType<typeof resolveTokenContract>;
  copied: boolean;
  onCopy: () => void;
}) {
  const addressDisplay =
    info.state === "configured" ? info.short : info.state === "invalid" ? "INVALID CONTRACT" : "TBA";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface/80">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(56,189,248,0.55), rgba(123,97,255,0.4), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-40 w-2/3 -translate-x-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(ellipse, #38BDF8, transparent 70%)" }}
      />
      <div className="flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {/* Left — token identity */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10"
            aria-hidden
          >
            <SolGlyph className="h-5 w-5 text-accent-soft" />
          </div>
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[17px] font-bold tracking-tight text-ink">$MEMEOS</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-faint">
                Solana token
              </span>
            </div>
            <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">
              {info.state === "tba" && "Contract: TBA · Not yet deployed"}
              {info.state === "invalid" && (
                <span className="text-warn">Invalid Solana address configured</span>
              )}
              {info.state === "configured" && "Contract verified format · Solana"}
            </div>
          </div>
        </div>

        {/* Center — contract field */}
        <div className="min-w-0 flex-1 lg:max-w-md">
          <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.26em] text-faint">
            Smart contract
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border bg-void/60 px-3.5 py-2.5 transition-colors",
              info.state === "configured"
                ? "border-edge2 hover:border-accent/40"
                : info.state === "invalid"
                  ? "border-warn/40"
                  : "border-edge"
            )}
            title={
              info.state === "configured"
                ? info.raw
                : info.state === "invalid"
                  ? "The configured address is not a valid Solana public key."
                  : "Contract address not available yet."
            }
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-mono text-[13px]",
                info.state === "configured"
                  ? "tabular-nums text-ink"
                  : info.state === "invalid"
                    ? "font-semibold uppercase tracking-[0.12em] text-warn"
                    : "font-bold tracking-[0.3em] text-faint"
              )}
            >
              {addressDisplay}
            </span>
            {info.state === "configured" ? (
              <button
                type="button"
                onClick={onCopy}
                aria-label={copied ? "Contract address copied" : "Copy contract address"}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                  copied
                    ? "border-up/50 text-up"
                    : "border-edge2 text-muted hover:border-accent hover:text-accent-soft"
                )}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Copy contract address (unavailable)"
                aria-disabled
                title="Contract address not available yet."
                className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint opacity-50"
              >
                <CopyIcon />
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Right — buy action */}
        <div className="flex items-center gap-2.5">
          {info.state === "configured" && info.buyUrl ? (
            <a
              href={info.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-[13px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_28px_rgba(123,97,255,0.35)] transition-transform hover:scale-[1.02] hover:bg-accent-soft"
            >
              Buy $MEMEOS
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled
              title={
                info.state === "invalid"
                  ? "Configured contract address is invalid."
                  : "Official MEMEOS contract address has not been announced yet."
              }
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-edge2 bg-surface2 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.14em] text-faint"
            >
              Coming soon
            </button>
          )}
          {info.state === "configured" && (
            <a
              href={info.solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-edge2 px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent-soft"
            >
              Solscan ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
