"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import type { WalletReadyState } from "@solana/wallet-adapter-base";
import { useApp } from "@/lib/providers/app-provider";
import { SOLANA_CLUSTER_LABEL } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * MEMEOS WALLET SELECTOR — custom premium modal over the official
 * @solana/wallet-adapter-react context. Only wallets actually registered by
 * the configured adapters / Wallet Standard are listed. Detection comes from
 * the adapter's own readyState — no manual window.* sniffing.
 */

type Status = "connect" | "connecting" | "rejected" | "error" | "connected";

const PRIORITY = [
  "Phantom",
  "Solflare",
  "Backpack",
  "Coinbase Wallet",
  "Glow",
  "Brave Wallet",
  "Torus",
  "Ledger",
];

function readyLabel(state: WalletReadyState): string {
  if (state === "Installed") return "Detected";
  if (state === "Loadable") return "Available";
  return "Not installed";
}

function isReady(state: WalletReadyState): boolean {
  return state === "Installed";
}

/** Deterministic sort: ready wallets first, then priority order, then name. */
function rankWallets(wallets: Wallet[]): Wallet[] {
  const p = (name: string) => {
    const i = PRIORITY.indexOf(name);
    return i === -1 ? PRIORITY.length : i;
  };
  return [...wallets].sort((a, b) => {
    const ra = isReady(a.readyState) ? 0 : 1;
    const rb = isReady(b.readyState) ? 0 : 1;
    if (ra !== rb) return ra - rb;
    const pa = p(a.adapter.name);
    const pb = p(b.adapter.name);
    if (pa !== pb) return pa - pb;
    return a.adapter.name.localeCompare(b.adapter.name);
  });
}

export function WalletSelector() {
  const router = useRouter();
  const { wallets, select, connect, connected, publicKey, wallet } = useWallet();
  const { walletOpen, setWalletOpen } = useApp();
  const [status, setStatus] = useState<Status>("connect");
  const [errorMsg, setErrorMsg] = useState("");
  const [showMore, setShowMore] = useState(false);

  const ready = useMemo(
    () => rankWallets(wallets.filter((w) => isReady(w.readyState))),
    [wallets]
  );
  const rest = useMemo(
    () => rankWallets(wallets.filter((w) => !isReady(w.readyState))),
    [wallets]
  );

  /* Route to the terminal once the wallet reports connected. */
  useEffect(() => {
    if (connected && publicKey && walletOpen && status !== "connected") {
      setStatus("connected");
      const t = setTimeout(() => {
        setWalletOpen(false);
        router.push("/terminal");
      }, 700);
      return () => clearTimeout(t);
    }
  }, [connected, publicKey, walletOpen, status, router, setWalletOpen]);

  /* Reset transient state after close so it can be reopened cleanly. */
  useEffect(() => {
    if (!walletOpen) {
      const t = setTimeout(() => {
        setStatus("connect");
        setErrorMsg("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [walletOpen]);

  if (!walletOpen) return null;

  const activeName = wallet?.adapter.name ?? "";

  async function handleSelect(w: Wallet) {
    setErrorMsg("");
    try {
      if (w.adapter.name !== activeName) {
        setStatus("connect");
        await select(w.adapter.name);
      }
      setStatus("connecting");
      await connect();
    } catch (err) {
      const e = err as { name?: string; message?: string };
      const rejected =
        e?.name === "WalletConnectionRejectedError" ||
        e?.name === "WalletDisconnectedError" ||
        /reject|cancel|denied/i.test(e?.message ?? "");
      setStatus(rejected ? "rejected" : "error");
      setErrorMsg(e?.message ?? "Unknown connection failure.");
    }
  }

  const statusText =
    status === "connecting"
      ? `CONNECTING TO ${(wallet?.adapter.name ?? "WALLET").toUpperCase()}…`
      : status === "connected"
        ? "CONNECTED"
        : status === "rejected"
          ? "CONNECTION CANCELLED"
          : status === "error"
            ? "COULDN'T CONNECT"
            : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== "connecting") setWalletOpen(false);
      }}
    >
      <div className="drawer-panel w-full max-w-[400px] overflow-hidden rounded-2xl border border-edge2 bg-surface shadow-[0_32px_110px_rgba(0,0,0,0.7)]">
        <div className="border-b border-edge px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
              memeos
            </span>
            <button
              onClick={() => setWalletOpen(false)}
              className="rounded-md px-2 py-0.5 text-[13px] text-faint transition-colors hover:bg-surface2 hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <h2 className="mt-2 text-[17px] font-bold tracking-tight text-ink">Connect wallet</h2>
          <p className="mt-1 text-[12px] text-muted">
            Choose a Solana wallet to access the MEMEOS intelligence terminal.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" aria-hidden />
            {SOLANA_CLUSTER_LABEL}
            <span className="text-faint/70">· read-only · no signature required</span>
          </div>
        </div>

        {statusText && (
          <div
            className={cn(
              "border-b border-edge px-5 py-3",
              status === "connected" && "bg-up/5",
              status === "rejected" && "bg-warn/5",
              status === "error" && "bg-down/5"
            )}
          >
            <div
              className={cn(
                "font-mono text-[11px] font-bold uppercase tracking-[0.2em]",
                status === "connected" && "text-up",
                status === "connecting" && "text-signal",
                status === "rejected" && "text-warn",
                status === "error" && "text-down"
              )}
            >
              {status === "connecting" && (
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-signal align-middle" />
              )}
              {statusText}
            </div>
            {status === "connected" && publicKey && (
              <div className="mt-1 font-mono text-[11px] text-muted">
                {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)} — entering
                the terminal…
              </div>
            )}
            {errorMsg && status !== "connecting" && (
              <div className="mt-1 text-[11px] text-faint">{errorMsg}</div>
            )}
            {(status === "rejected" || status === "error") && (
              <button
                onClick={() => setStatus("connect")}
                className="mt-2 rounded-md border border-edge2 bg-surface2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent/50 hover:text-accent-soft"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {status !== "connected" && status !== "connecting" && (
          <div className="max-h-[46vh] overflow-y-auto px-3 py-3">
            {wallets.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-faint">
                No Solana wallets registered yet — install Phantom or another
                Wallet-Standard wallet, then reopen this dialog.
              </div>
            )}
            {ready.map((w) => (
              <WalletRow key={w.adapter.name} w={w} onPick={handleSelect} />
            ))}
            {ready.length > 0 && rest.length > 0 && (
              <button
                onClick={() => setShowMore((v) => !v)}
                className="mt-2 w-full rounded-lg px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-faint transition-colors hover:bg-surface2 hover:text-muted"
              >
                {showMore ? "Fewer wallets" : `More wallets (${rest.length})`}
              </button>
            )}
            {(showMore || ready.length === 0) &&
              rest.map((w) => <WalletRow key={w.adapter.name} w={w} onPick={handleSelect} />)}
          </div>
        )}

        <div className="border-t border-edge px-5 py-3 text-[10.5px] leading-relaxed text-faint">
          Detection and connection run through the official Solana wallet adapter and
          Wallet Standard. MEMEOS never requests signatures, transactions or approvals
          for terminal access.
        </div>
      </div>
    </div>
  );
}

function WalletRow({ w, onPick }: { w: Wallet; onPick: (w: Wallet) => void }) {
  const ready = isReady(w.readyState);
  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-150",
        ready ? "hover:border-edge2 hover:bg-surface2" : "opacity-55"
      )}
    >
      {ready ? (
        <button
          onClick={() => onPick(w)}
          title={`Connect ${w.adapter.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <RowBody w={w} ready={ready} />
        </button>
      ) : (
        <div
          className="flex min-w-0 flex-1 items-center gap-3"
          title={`${w.adapter.name} is not installed`}
        >
          <RowBody w={w} ready={ready} />
        </div>
      )}
      {ready ? (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors group-hover:text-accent-soft">
          Connect →
        </span>
      ) : w.adapter.url ? (
        <a
          href={w.adapter.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md border border-edge2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-signal transition-colors hover:border-signal/60 hover:bg-signal/10"
        >
          Install
        </a>
      ) : null}
    </div>
  );
}

function RowBody({ w, ready }: { w: Wallet; ready: boolean }) {
  return (
    <>
      {w.adapter.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={w.adapter.icon}
          alt=""
          width={30}
          height={30}
          className="h-[30px] w-[30px] rounded-lg"
        />
      ) : (
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-surface2 font-mono text-[12px] text-muted">
          {w.adapter.name.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold text-ink">
          {w.adapter.name}
        </span>
        <span
          className={cn(
            "block text-[11px]",
            ready ? "text-up" : w.readyState === "Loadable" ? "text-signal" : "text-faint"
          )}
        >
          {readyLabel(w.readyState)}
        </span>
      </span>
    </>
  );
}
