"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "@/lib/providers/app-provider";
import { useApi } from "@/lib/hooks/use-api";
import type { SearchResults } from "@/lib/types";
import { shortAddr } from "@/lib/utils";

/** Global command search — instant, debounced, keyboard-first ("/"). */
export function SearchCommand() {
  const { searchOpen, setSearchOpen } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [searchOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading } = useApi<SearchResults>(
    debounced ? `/api/search?q=${encodeURIComponent(debounced)}` : "/api/search?q=",
    {}
  );

  if (!searchOpen) return null;
  const go = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };
  const hasAny =
    (data && (data.tokens.length + data.wallets.length + data.narratives.length + data.creators.length) > 0) ?? false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-void/80 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
      role="dialog"
      aria-label="Global search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-edge2 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-edge px-4 py-3">
          <Search size={15} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search token, address, narrative…"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(e) => {
              if (e.key === "Enter" && data?.tokens.length) go(`/token/${data.tokens[0].address}`);
            }}
          />
          <kbd className="rounded border border-edge2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ESC
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!debounced && (
            <p className="px-3 py-6 text-center text-[13px] text-faint">
              Type to search the Solana meme economy
            </p>
          )}
          {debounced && loading && !data && (
            <p className="px-3 py-6 text-center text-[13px] text-faint">Searching…</p>
          )}
          {data?.tokens.map((t) => (
            <button
              key={t.address}
              onClick={() => go(`/token/${t.address}`)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-surface2"
            >
              <span className="font-mono text-[13px] font-semibold text-accent-soft">{t.ticker}</span>
              <span className="truncate text-[13px] text-ink">{t.name}</span>
              <span className="ml-auto font-mono text-[11px] text-faint">{shortAddr(t.address)}</span>
            </button>
          ))}
          {data?.narratives.map((n) => (
            <Link
              key={n.slug}
              href={`/narrative/${n.slug}`}
              onClick={() => setSearchOpen(false)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-surface2"
            >
              <span className="text-[13px] text-ink">{n.name}</span>
              <span className="ml-auto text-[11px] uppercase tracking-wider text-faint">narrative</span>
            </Link>
          ))}
          {data?.wallets.map((w) => (
            <button
              key={w.address}
              onClick={() => go(`/wallet/${w.address}`)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-surface2"
            >
              <span className="font-mono text-[12px] text-ink">{shortAddr(w.address, 8)}</span>
              <span className="ml-auto text-[11px] uppercase tracking-wider text-faint">wallet</span>
            </button>
          ))}
          {data?.creators.map((c) => (
            <button
              key={c.address}
              onClick={() => go(`/creator/${c.address}`)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-surface2"
            >
              <span className="font-mono text-[12px] text-ink">{shortAddr(c.address, 8)}</span>
              <span className="ml-auto text-[11px] uppercase tracking-wider text-faint">creator</span>
            </button>
          ))}
          {debounced && data && !hasAny && !loading && (
            <p className="px-3 py-6 text-center text-[13px] text-faint">
              Nothing found for “{debounced}”
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
