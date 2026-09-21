"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-down/80">
        Something broke
      </div>
      <h1 className="text-xl font-bold text-ink">MEMEOS hit an unexpected error</h1>
      <p className="max-w-md text-[13px] text-muted">
        {error.message || "An internal error occurred."} Raw diagnostics are never shown
        here — retry usually fixes transient upstream failures.
      </p>
      <button
        onClick={reset}
        className="rounded-md border border-edge2 bg-surface2 px-4 py-2 text-[13px] font-semibold text-ink hover:border-accent"
      >
        Retry
      </button>
    </div>
  );
}
