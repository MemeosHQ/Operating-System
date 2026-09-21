import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-faint">404</div>
      <h1 className="text-2xl font-bold text-ink">Not in the index</h1>
      <p className="max-w-sm text-[14px] text-muted">
        This address, narrative or page doesn&apos;t exist in MEMEOS yet.
      </p>
      <Link
        href="/terminal"
        className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:bg-accent-soft"
      >
        Back to terminal
      </Link>
    </div>
  );
}
