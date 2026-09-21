"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useApp } from "@/lib/providers/app-provider";
import { cn } from "@/lib/utils";

/** Topbar wallet control: CONNECT WALLET chip when disconnected; address menu when connected. */
export function WalletMenu() {
  const { connecting, connected, publicKey, wallet, disconnect } = useWallet();
  const { setWalletOpen } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = publicKey?.toBase58() ?? "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!connected || !publicKey || !wallet) {
    return (
      <button
        onClick={() => setWalletOpen(true)}
        disabled={connecting}
        className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_18px_rgba(123,97,255,0.3)] transition-all hover:bg-accent-soft disabled:opacity-60"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-edge2 bg-surface2/70 px-3 py-1 font-mono text-[11px] font-bold text-ink transition-colors hover:border-accent/50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-up" aria-hidden />
        {short}
        <span className={cn("text-faint transition-transform", open && "rotate-180")}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="drawer-panel absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-edge2 bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          <div className="border-b border-edge px-4 py-3">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">
              Connected wallet
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {wallet.adapter.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={wallet.adapter.icon}
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] rounded"
                />
              )}
              <span className="text-[12.5px] font-semibold text-ink">{wallet.adapter.name}</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted">{short}</div>
          </div>
          <div className="px-2 py-2">
            <button
              onClick={copy}
              className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-muted transition-colors hover:bg-surface2 hover:text-ink"
            >
              {copied ? "Address copied ✓" : "Copy address"}
            </button>
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg px-3 py-2 text-[12px] text-muted transition-colors hover:bg-surface2 hover:text-ink"
            >
              View on Solscan ↗
            </a>
            <button
              onClick={() => {
                setOpen(false);
                setWalletOpen(true);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-muted transition-colors hover:bg-surface2 hover:text-ink"
            >
              Switch wallet
            </button>
            <button
              onClick={async () => {
                setOpen(false);
                try {
                  await disconnect();
                } catch {
                  /* provider already gone */
                }
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-down transition-colors hover:bg-down/10"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
