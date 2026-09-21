/**
 * Centralized token-image URL normalization — used by both server (providers)
 * and client (TokenLogo fallback chain). Only safe protocols are allowed:
 * https, plus IPFS and Arweave gateway resolution. Everything else
 * (javascript:, data:, unknown schemes) is rejected — never rendered.
 */

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
const ARWEAVE_GATEWAY = "https://arweave.net/";

const SAFE_HTTP_HOST_SUFFIXES = [
  // Cloudflare IPFS gateway
  "cf-ipfs.com",
  // Arweave gateways
  "arweave.net",
  "arweave.dev",
  // MEMEOS-known metadata CDNs (DexScreener, Pump.fun, Helius)
  "cdn.dexscreener.com",
  "ipfs.io",
  "gateway.pinata.cloud",
  "cloudflare-ipfs.com",
  "arweave.arweave.net",
];

function isSafeHttps(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  // Allow all https hosts except obviously malformed ones — image hosts for
  // Solana metadata vary widely (supabase, mush, metamask, etc.).
  return url.hostname.includes(".");
}

/** Normalize a token image URI to a renderable HTTPS URL, or null. */
export function normalizeTokenImageUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    if (value.startsWith("ipfs://")) {
      const rest = value.slice("ipfs://".length).replace(/^ipfs\//, "");
      return `${IPFS_GATEWAY}${rest}`;
    }
    if (value.startsWith("ar://")) {
      return `${ARWEAVE_GATEWAY}${value.slice("ar://".length)}`;
    }
    const url = new URL(value);
    if (url.protocol === "http:") {
      // Upgrade plain http to https for the same host (metadata CDNs are https).
      url.protocol = "https:";
      return isSafeHttps(url) ? url.toString() : null;
    }
    if (isSafeHttps(url)) return url.toString();
    // Unknown custom gateway domain that is still a well-formed https URL —
    // allow if the host looks like a known gateway suffix.
    const host = url.hostname.toLowerCase();
    if (SAFE_HTTP_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/** Build an ordered, deduplicated candidate list from raw metadata URLs.
 *  Any `https://<gateway>/ipfs/<CID>` form is expanded into a resilient
 *  multi-gateway chain so onError can fall through when one gateway
 *  rate-limits or goes down (verified live: pinata 200, dweb/ipfs.io down). */
export function buildImageCandidates(...candidates: (string | undefined | null)[]): string[] {
  const out: string[] = [];
  for (const c of candidates) {
    const normalized = normalizeTokenImageUrl(c);
    if (!normalized) continue;
    const cid = normalized.match(/^https:\/\/[^/]+\/ipfs\/(.+)$/);
    if (cid) {
      for (const g of [
        `https://gateway.pinata.cloud/ipfs/${cid[1]}`,
        `https://ipfs.io/ipfs/${cid[1]}`,
        `https://4everland.io/ipfs/${cid[1]}`,
        normalized,
      ]) {
        if (!out.includes(g)) out.push(g);
      }
    } else if (!out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}
