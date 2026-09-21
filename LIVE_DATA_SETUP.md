# LIVE_DATA_SETUP — API / Provider Audit & Integration Status

Columns per policy: FEATURE · PROVIDER · ENDPOINT · AUTH · ENV VAR · PLAN · STATUS · LAST VERIFIED · FALLBACK.
**LAST VERIFIED: 2026-09-20** (live `/api/health` probes + direct upstream requests, local and deployed).
Statuses: CONNECTED = code + verified passing probe · MISSING = code complete, activates with credential · NOT USED = deliberately not called.

Demo mode (`MEMEOS_DEMO_MODE=true` / `NEXT_PUBLIC_DATA_MODE=demo`) requires **zero credentials**.
Live mode uses the same components/services; unconfigured features fail HONESTLY (DataUnavailableError naming the required env var).

---

## FEATURE × PROVIDER MATRIX

| FEATURE | PROVIDER | ENDPOINT | AUTH | ENV VAR | PLAN | STATUS | LAST VERIFIED | FALLBACK |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Solana RPC (health, slot, balances) | Helius (primary) / public RPC (fallback) | `POST https://mainnet.helius-rpc.com/?api-key=KEY` / `POST https://api.mainnet-beta.solana.com` | Key-in-URL (Helius, server-only) | `HELIUS_API_KEY` | Helius Free tier sufficient | **CONNECTED** (public RPC verified) | 2026-09-20 | Public RPC (rate-limited) — automatic without a key |
| Market data (price, mcap, liquidity, volume) | DexScreener | `GET https://api.dexscreener.com/latest/dex/search?q=` · `/token-pairs/v1/solana/{addr}` · `/tokens/v1/solana/{addrs}` | None (documented keyless) | `NEXT_PUBLIC_DEXSCREENER_API_URL` | Free, no key; rate limits honored via caching | **CONNECTED** | 2026-09-20 | — |
| Launch discovery | Pump.fun public read API (+ on-chain program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) | `GET https://frontend-api-v3.pump.fun/coins?sort=created_timestamp…` | None (keyless) | — | Free | **CONNECTED** | 2026-09-20 (deployed probe; local probe hit transient upstream 5xx — surfaced honestly) | On-chain program indexing via Helius when configured |
| Wallet SOL balance | Solana RPC | `getBalance` | None (public) | — | n/a | **CONNECTED** | 2026-09-20 | — |
| Wallet parsed trade history | **Helius Enhanced Transactions** | `GET https://api.helius.xyz/v0/addresses/{ADDR}/transactions?api-key=KEY` | API key (server-only) | `HELIUS_API_KEY` | Free tier includes Enhanced TX (rate-limited) | **MISSING** (code complete) | code, 2026-09-20 | **UNAVAILABLE** (honest state naming the env var) |
| Token metadata (on-chain) | **Helius DAS** | RPC `getAsset` via `mainnet.helius-rpc.com` | API key (server-only) | `HELIUS_API_KEY` | Free tier includes DAS | **MISSING** (code complete) | code, 2026-09-20 | DexScreener pair metadata alone |
| First-60-seconds launch replay (live mints) | **Helius Enhanced Transactions** | same endpoint, per mint | API key (server-only) | `HELIUS_API_KEY` | Free tier (rate-limited; cached 60s) | **MISSING** (code complete) | code, 2026-09-20 | Demo mode: deterministic replay · live mode: UNAVAILABLE without key |
| Holder counts (DNA holder quality) | Birdeye (optional) | `GET https://public-api.birdeye.so/defi/token_overview?address=` (`X-API-KEY`, `chain: solana`) | API key (server-only) | `BIRDEYE_API_KEY` | Free tier w/ rate limits | **MISSING** (optional) | code, 2026-09-20 | Labeled market-cap proxy (never presented as observed) |
| Attention engine | MEMEOS own math | — (`src/lib/metrics/attention.ts`) | none | — | n/a | **CONNECTED** | 2026-09-20 | — |
| Narrative engine | MEMEOS own math + keyword taxonomy | — (`src/lib/metrics/narrative.ts`) | none | — | n/a | **CONNECTED** | 2026-09-20 | — |
| Meme DNA | MEMEOS own math | — (`src/lib/metrics/dna.ts`) | none | — | n/a | **CONNECTED** | 2026-09-20 | — |
| Lifecycle staging | MEMEOS own math | — (`src/lib/metrics/lifecycle.ts`) | none | — | n/a | **CONNECTED** | 2026-09-20 | — |
| AI Analyst | MEMEOS rule engine (default) / LLM (optional) | Gemini REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=KEY` | API key (server-only) | `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Gemini free tier viable | **CONNECTED** (rule engine, no key) | 2026-09-20 | Rule engine is the permanent fallback — answers only from in-app data |
| Health checks | MEMEOS `/api/health` | probes: RPC `getSlot`, DexScreener, Pump.fun, Helius `getSlot` | n/a | — | n/a | **CONNECTED** | 2026-09-20 (deployed: rpc ✓ dex ✓ pump ✓ helius unconfigured) | — |
| Snapshot history / server watchlists / wallet graph | PostgreSQL | `DATABASE_URL` (any Postgres 14+) | connection string | `DATABASE_URL` | Free tiers exist (Neon/Supabase) | **MISSING** (deliberately unbuilt in v1) | — | UNAVAILABLE (honest states name the requirement) |
| Social signals | none | — | — | — | — | **NOT USED** | — | Social section reports UNAVAILABLE; nothing fabricated |
| Real-time streaming | Helius WebSocket / webhooks | `wss://…helius-rpc.com/?api-key=KEY` + webhook config | API key (server-only) | `HELIUS_API_KEY` | **PLAN REQUIRED**: dedicated webhooks/streaming capacity depends on Helius plan — not verifiable without an account; current fallback is server-side polling | **MISSING** (documented; NOT active) | — | Server-side polling of cached APIs (current behavior) |

---

## ARCHITECTURE (enforced)

```
Frontend → MEMEOS API routes → provider abstraction (Demo | Live)
                                    ├─ dexscreener.ts   (market, keyless)
                                    ├─ pumpfun.ts       (launch discovery, keyless)
                                    ├─ rpc.ts           (Solana JSON-RPC)
                                    ├─ helius.ts        (DAS + Enhanced TX, HELIUS_API_KEY)
                                    ├─ birdeye.ts       (holders, BIRDEYE_API_KEY)
                                    └─ metrics/*        (attention, DNA, narrative, lifecycle)
```

- All secrets server-side only — `src/lib/server/env.ts` is the single reader; one-time startup validation.
- The frontend never calls a third-party API directly.
- Every upstream call is cached (15s/60s/300s TTLs), retried once, timeout-bounded.
- `MEMEOS_DEMO_MODE=true|false` (server) wins over `NEXT_PUBLIC_DATA_MODE`; selection lives in `src/lib/services/index.ts`.
- **Endpoint verification:** every endpoint in this file was checked against current provider documentation this session (2026-09-20); none was invented from old tutorials. Read-only analytics only.

## SMOKE TESTS

`tests/providers.smoke.test.ts` — always-on config tests + opt-in real connectivity (`RUN_LIVE_SMOKE=1 npm test`; Helius/Birdeye probes run only when their keys are set; otherwise skipped, never faked).

## MEMEOS AI (2026-09-21)

- **LLM:** Gemini via the current **Interactions API** (`POST https://generativelanguage.googleapis.com/v1beta/interactions`, auth header `x-goog-api-key`, model configurable via `GEMINI_MODEL`, default `gemini-3.8-flash` — current stable Flash per official docs; `gemini-2.x` is shut down). Server-only (`src/lib/ai/gemini.ts`), zero extra dependencies, key never exposed.
- **Engine:** `src/lib/ai/engine.ts` — Gemini when `GEMINI_API_KEY` is set and healthy; deterministic **rule engine** fallback otherwise (and on Gemini failure, flagged `degraded`). The UI always shows the real engine.
- **Context:** `src/lib/ai/context.ts` — `resolveQuestionEntities()` (ticker/mint/wallet/narrative resolution, ambiguity → clarification) + `assembleAiContext()` (only relevant canonical data: narrative intelligence, token/attention/DNA, wallet activity, launch replay; fenced untrusted metadata; DATA AS OF + staleness).
- **Rate limit:** `src/lib/server/rate-limit.ts` — 10 req/min sliding window on `/api/ai/analyst`.
- **Health:** `llm` field — `gemini-live` (real probe passed) / `degraded` (key set, probe failed) / `unconfigured`. Rule engine always `ai: connected`.

## NARRATIVE MOMENTUM FORMULA (2026-09-20)

**CANONICAL SOURCE (2026-09-21):** `src/lib/server/narrative-intelligence.ts` → `getNarrativeIntelligence()` is the single source of truth. Consumers: `/api/narratives` (→ `/narratives` page) AND `/api/attention` (→ `/attention`, `/live`, terminal, landing). Both APIs return the same canonical snapshot — snapshot cycles are wall-clock aligned (30s windows) so every consumer in a window shares one `generatedAt` and one calculation. `/attention` shows narrative-level MOMENTUM from this service; its Exploding/Accelerating/Cooling/Steady sections remain TOKEN-level attention from the token attention engine (`classify()`), which is a separate, documented metric. Automated guard: `tests/narrative-sync.test.ts` asserts both APIs expose identical `momentumPct` / `momentumStatus` / `tokenCount` / `volume` / `generatedAt` (skips, never fakes, when no server is running).

**Concepts (separated):**
- Classification = keyword taxonomy on token name/symbol (stable; never reclassified on price change)
- Activity = current aggregates: token count, 24h volume, transactions, notable-wallet proxy, new launches (all LIVE from DexScreener/Pump)
- Momentum = % change of those aggregates vs. a REAL previous observed snapshot
- Rank = momentum (descending); narratives still building rank by attention level

**Inputs:** current vs. previous narrative aggregates — `volume24hUsd`, `txns24h`, `attentionDeltaPct`, `newLaunches24h`, `tokenCount`, `activeWallets`.

**Window:** current live values vs. the newest persisted snapshot that is **5–20 minutes old**. Refresh (60s polling) ≠ momentum window.

**Formula** (weights renormalize over available components; result clamped ±300):

```
volumeAccelPct  = (V_cur − V_prev) / V_prev × 100     weight 0.50  [null if V_prev < $1,000]
txnsAccelPct    = (T_cur − T_prev) / T_prev × 100     weight 0.30  [null if T_prev < 50]
attentionChange = A_cur − A_prev (percentage points)  weight 0.15
launchGrowthPct = (L_cur − L_prev) / max(L_prev, 1)    weight 0.05

momentumPct = Σ(weightᵢ · componentᵢ) / Σ(weightᵢ)
```

Attention/launch components only count when at least one rate component (volume/txns) is valid — this prevents momentum from being fabricated for a dead narrative.

**Minimum sample:** previous snapshot with `volume24hUsd ≥ $1,000` or `txns24h ≥ 50`, captured 5–20 minutes ago.

**Fallback:** if no qualifying previous snapshot exists, or both rate components are null → `momentumPct = null`, status **BUILDING_BASELINE**. Low activity is NEVER reported as −100% and missing history is NEVER reported as 0%.

**Status:** ≥ +25 ACCELERATING · ≥ +5 RISING · > −5 STEADY · > −25 COOLING · ≤ −25 FADING · null BUILDING_BASELINE.

**Persistence:** snapshots written by `/api/narratives` (60s gate) and `/api/jobs/snapshot`; each row carries `sourceMode` (DEMO/LIVE isolation).

**Storage note:** Supabase session-mode pooler allows few connections per session — the Prisma client runs with `connection_limit=5`.
