# API_AUDIT — MEMEOS final provider / credential matrix

Audited against the actual codebase (trace: UI → API route → service → provider → endpoint → auth).
**LIVE VERIFIED 2026-09-20:** `/api/health` = `rpc ✓ · dexscreener ✓ · pumpfun ✓ · helius ✓ · ai ✓ · data: live`; live smoke suite 48/49 (1 skip = Birdeye, no key).

| Provider | Feature | API Key | Env Var | Endpoint (exact, as used by code) | Plan | Status | Required? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Helius | Wallet balance (RPC), token metadata (DAS `getAsset`), parsed wallet history + launch replay (Enhanced Transactions v0), health probe | Yes (server-only) | `HELIUS_API_KEY` — **CONFIGURED** | `POST https://mainnet.helius-rpc.com/?api-key=KEY` · `GET https://api.helius.xyz/v0/addresses/{ADDR}/transactions?api-key=KEY` | Free tier covers current usage | **CONNECTED (verified)** | **REQUIRED NOW** — primary Solana layer |
| Public Solana RPC | RPC fallback, client-side wallet adapter endpoint | No | `NEXT_PUBLIC_SOLANA_RPC_URL` (optional; default official) | `POST https://api.mainnet-beta.solana.com` | n/a | **CONNECTED** | Built-in fallback — no credential |
| DexScreener | Price, mcap, liquidity, volume, pairs, tx counts, search | **No** (documented keyless) | `NEXT_PUBLIC_DEXSCREENER_API_URL` (optional; default official) | `GET /latest/dex/search` · `/token-pairs/v1/solana/{addr}` · `/tokens/v1/solana/{addrs}` | Free, rate-limited (cached 15s) | **CONNECTED (verified)** | In use — **no key needed** |
| Pump.fun | Launch discovery (new tokens, creator, mcap, graduation status) | **No** (official public read API) | — | `GET https://frontend-api-v3.pump.fun/coins?…`; on-chain program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` reserved for deeper indexing | Free | **CONNECTED (verified)** | In use — **no key needed** |
| Birdeye | Real holder counts → DNA holder-quality (currently a **labeled proxy** without it) | Yes (server-only) | `BIRDEYE_API_KEY` — MISSING | `GET https://public-api.birdeye.so/defi/token_overview?address=` (`X-API-KEY`, `chain: solana`) | Free tier w/ rate limits | **NOT CONNECTED** (code complete; smoke probe skipped) | **OPTIONAL** |
| LLM (Gemini/OpenAI/Anthropic) | Analyst upgrade | Would be Yes | `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — MISSING (reserved) | Documented: Gemini `POST …/gemini-2.0-flash:generateContent` | Free tier viable | **NOT IMPLEMENTED** — no LLM client exists; rule engine is live | **NOT REQUIRED now** (needs code first) |
| PostgreSQL | Snapshot history, DNA/attention history, wallet graph, server watchlists, agent detection, launch event persistence | Connection string | `DATABASE_URL` — MISSING | Any Postgres 14+ | Free tiers exist (Neon/Supabase) | **NOT IMPLEMENTED** (v1 deliberately) | **OPTIONAL** |
| Social / X / Telegram / Discord | none | — | — | — | — | **NOT USED** | **NOT REQUIRED** (no social feature exists) |
| Helius streaming (WS/webhooks) | Real-time push | Yes | (same `HELIUS_API_KEY`) | `wss://…helius-rpc.com/?api-key=KEY` | Plan-dependent — unverified | **NOT IMPLEMENTED** | **NOT REQUIRED now** — server-side polling is the current, working architecture |
| Solana wallet adapter | Browser wallet connect (read-only) | No | — | Wallet Standard / injected providers | n/a | **CONNECTED** (app-level) | No credential |

## Feature → provider trace (all terminal routes)

- `/terminal`, `/live`, `/attention`, `/narratives`, `/creators` → `/api/tokens|attention|narratives|creators|launches` → DexScreener + Pump.fun + MEMEOS math — **LIVE, keyless**
- `/dna` → `/api/dna/[addr]` → DexScreener + Helius DAS enrichment + DNA math — **LIVE** (holder dimension = labeled proxy until Birdeye)
- `/wallets`, `/wallet/[addr]` → `/api/wallets/[addr]` → Helius RPC + Enhanced Transactions — **LIVE** with `HELIUS_API_KEY`
- `/launches`, launch replay → `/api/launches[/addr]` → Pump.fun + Helius Enhanced Transactions — **LIVE** (verified: real per-mint event timelines)
- `/agents` → honest UNAVAILABLE in live mode — **BLOCKED on DATABASE_URL + indexed streams** (code + plan, not credentials alone)
- `/watchlist` → localStorage (client-only) — **NO API**
- Global search → `/api/search` → DexScreener + live token list + taxonomy — **LIVE, keyless, no extra API**
- AI Analyst → `/api/ai/analyst` → rule engine over in-app data — **LIVE, keyless**
- Health → `/api/health` → real upstream probes — **LIVE**

## Environment files (2026-09-20)

| Variable | .env.local | .env.example | Used by code | Status |
| --- | --- | --- | --- | --- |
| `HELIUS_API_KEY` | **CONFIGURED** (server-only) | placeholder | `src/lib/server/env.ts` → helius.ts | USED |
| `MEMEOS_DEMO_MODE` | **false** | documented | `env.ts`, `config.ts`, `services/index.ts` | USED |
| `NEXT_PUBLIC_DATA_MODE` | not set | documented | `config.ts` (fallback only) | USED (fallback) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | not set | documented | `config.ts`, `rpc.ts` | USED (fallback) |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | not set | documented | `config.ts`, wallet provider | USED (default mainnet-beta) |
| `NEXT_PUBLIC_DEXSCREENER_API_URL` | not set | documented | `config.ts` | USED (default official) |
| `BIRDEYE_API_KEY` | not set | placeholder | `birdeye.ts` | USED WHEN SET — OPTIONAL |
| `GEMINI/OPENAI/ANTHROPIC_API_KEY` | not set | placeholder (marked RESERVED) | read by `env.ts` only — **no LLM client yet** | RESERVED — NOT REQUIRED |
| `DATABASE_URL` | not set | placeholder | read by `env.ts` only — **no DB layer yet** | RESERVED — NOT REQUIRED |
| `NEXT_PUBLIC_APP_URL` | — | **removed** (unused) | nothing | UNUSED — REMOVED |

No secret uses `NEXT_PUBLIC_*`; the Helius key is read exclusively in `src/lib/server/env.ts` + `src/lib/services/live/helius.ts` (both `server-only`).
