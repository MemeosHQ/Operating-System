/** Small shared helpers (hydration-safe, dependency-free). */

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic PRNG — keeps SSR and client renders identical. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 14), 1 | a)) >>> 0;
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function fmtPct(n: number, digits = 0) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function shortAddr(addr: string, size = 4) {
  if (!addr) return "";
  if (addr.length <= size * 2 + 3) return addr;
  return `${addr.slice(0, size)}…${addr.slice(-size)}`;
}

export function fmtAge(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / (60 * 24)).toFixed(1)}d`;
}

export function relTime(ms: number) {
  const delta = Date.now() - ms;
  if (delta < 60_000) return `${Math.max(1, Math.round(delta / 1000))}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return `${Math.round(delta / 86_400_000)}d ago`;
}

/** Base58 validation for Solana public keys (no checksum — format-level only). */
export function isSolanaAddress(input: string) {
  const s = input.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

export function fmtSeconds(t: number) {
  const s = Math.floor(t);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
