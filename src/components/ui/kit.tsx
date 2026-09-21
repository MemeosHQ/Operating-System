"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { cn, shortAddr } from "@/lib/utils";
import { normalizeTokenImageUrl } from "@/lib/image-url";

/** MEMEOS design-system primitives. Compact, quiet, terminal-grade. */

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <As className={cn("rounded-lg border border-edge bg-surface", className)}>
      {children}
    </As>
  );
}

export function PanelHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-edge px-4 py-3">
      <div>
        <h2 className="text-[13px] font-semibold tracking-wide text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline";
export function Button({
  variant = "outline",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-accent text-white hover:bg-accent-soft border border-accent shadow-[0_0_18px_rgba(123,97,255,0.25)]",
    outline: "border border-edge2 bg-surface2 text-ink hover:border-accent hover:text-accent-soft",
    ghost: "text-muted hover:text-ink",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "outline",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-accent text-white hover:bg-accent-soft shadow-[0_0_24px_rgba(123,97,255,0.3)]",
    outline: "border border-edge2 bg-surface2 text-ink hover:border-accent hover:text-accent-soft",
    ghost: "text-muted hover:text-ink",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "up" | "down" | "warn" | "live";
  className?: string;
}) {
  const tones = {
    neutral: "border-edge2 text-muted",
    accent: "border-accent/50 text-accent-soft bg-accent/10",
    up: "border-up/40 text-up bg-up/10",
    down: "border-down/40 text-down bg-down/10",
    warn: "border-warn/40 text-warn bg-warn/10",
    live: "border-live/40 text-live bg-live/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "up" | "down" | "accent";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-faint">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-[15px] font-semibold tabular-nums",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "accent" && "text-accent-soft"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

const LOGO_HUES = [265, 160, 200, 20, 320, 45, 110];

/**
 * Shared token logo — renders real metadata images with an ordered candidate
 * chain (on error, advances to the next real source; initials ONLY after all
 * real sources fail). Lazy-loaded, fixed dimensions, no layout shift.
 */
export function TokenLogo({
  ticker,
  url,
  urls,
  size = 28,
}: {
  ticker: string;
  url?: string;
  urls?: string[];
  size?: number;
}) {
  const hue = LOGO_HUES[(ticker.charCodeAt(1) ?? 0) % LOGO_HUES.length] ?? 265;
  const urlsKey = (urls ?? []).join("|");
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    for (const c of [url, ...(urls ?? [])]) {
      const normalized = normalizeTokenImageUrl(c);
      if (normalized) seen.add(normalized);
    }
    return [...seen];
    // url/urls arrive together per token; ticker only drives the fallback hue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, urlsKey]);
  const [idx, setIdx] = useState(0);

  // Reset the chain when the candidate list changes (list re-renders).
  useEffect(() => {
    setIdx(0);
  }, [urlsKey]);

  const current = candidates[idx];
  if (current) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={current}
        src={current}
        alt={ticker}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => {
          // Advance to the next real source; broken URLs are never retried.
          setIdx((i) => i + 1);
        }}
        className="rounded-md border border-edge2 bg-surface2 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-md border border-edge2 font-mono font-bold text-ink/90"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 60% 16%), hsl(${hue} 55% 24%))`,
      }}
      aria-label={ticker}
    >
      {ticker.replace("$", "").slice(0, 2)}
    </div>
  );
}

export function AddrLink({ address, className }: { address: string; className?: string }) {
  return (
    <span
      className={cn("font-mono text-[11px] text-faint hover:text-accent-soft", className)}
      title={address}
    >
      {shortAddr(address)}
    </span>
  );
}

export function StatusDot({ tone = "live", pulse = true }: { tone?: "live" | "warn" | "down"; pulse?: boolean }) {
  const color = tone === "live" ? "bg-live" : tone === "warn" ? "bg-warn" : "bg-down";
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color, pulse && "live-dot")} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface2", className)} />;
}
