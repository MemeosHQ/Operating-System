"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/kit";

/** The three mandatory states for every live-data surface. */

export function LoadingState({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <div aria-busy="true" aria-label={label ?? "Loading"}>
      {label && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal live-dot" />
          {label}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="shimmer h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Signal-loader — MEMEOS' non-spinner loading mark. */
export function SignalLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative inline-flex h-3 w-3">
        <span className="soft-ping absolute inline-flex h-full w-full rounded-full bg-signal/60" />
        <span className="relative inline-flex h-3 w-3 rounded-full border border-signal/70 bg-signal/20" />
      </span>
      {label && <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{label}</span>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  listening = false,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  listening?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-edge/70 bg-surface/40 px-6 py-14 text-center">
      {listening ? (
        <span className="relative mb-5 inline-flex h-8 w-8 items-center justify-center">
          <span className="soft-ping absolute inline-flex h-full w-full rounded-full bg-signal/40" />
          <span className="relative inline-flex h-4 w-4 rounded-full border border-signal/60 bg-signal/10" />
        </span>
      ) : (
        <span className="mb-5 inline-block h-px w-14 bg-edge2" />
      )}
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">
        {listening ? "No signals yet" : "No data"}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  requiredEnv,
  onRetry,
}: {
  message: string;
  requiredEnv?: string[];
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-edge bg-surface px-6 py-14 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-down/80">
        Unavailable
      </div>
      <h3 className="mt-3 max-w-md text-[15px] font-semibold text-ink">{message}</h3>
      {requiredEnv && requiredEnv.length > 0 && (
        <p className="mt-2 rounded border border-edge2 bg-surface2 px-3 py-1.5 font-mono text-[11px] text-warn">
          requires: {requiredEnv.join(" · ")}
        </p>
      )}
      {onRetry && (
        <Button className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Renders loading / error / empty / data for any useApi result. */
export function StateGate({
  loading,
  error,
  requiredEnv,
  onRetry,
  isEmpty,
  empty,
  children,
}: {
  loading: boolean;
  error: string | null;
  requiredEnv?: string[];
  onRetry?: () => void;
  isEmpty?: boolean;
  empty?: { title: string; hint?: string };
  children: ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} requiredEnv={requiredEnv} onRetry={onRetry} />;
  if (isEmpty && empty) return <EmptyState title={empty.title} hint={empty.hint} />;
  return <>{children}</>;
}
