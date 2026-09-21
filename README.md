# MEMEOS

**The Intelligence Layer for Solana Memes.**

MEMEOS is a read-only intelligence platform for the Solana meme economy. It
tracks where attention is moving — across tokens, wallets, narratives and
launches — and turns live on-chain and market data into transparent,
calculated intelligence.

> Pump.fun shows you the memes. MEMEOS shows you what is happening underneath
> them.

## Overview

MEMEOS observes the meme economy in real time and derives its own
intelligence from observable data:

- **Attention engine** — every token is scored against its own age-adjusted
  baseline (volume / buyer / transaction acceleration).
- **Narrative engine** — tokens are classified into narratives by keyword
  taxonomy; narrative **momentum** is the weighted change (volume 0.50 +
  transactions 0.30 + attention 0.15 + launches 0.05) versus a real previous
  5–20 minute snapshot. Insufficient history is honestly reported as
  `BUILDING BASELINE`, never as a fake percentage.
- **Meme DNA** — an 8-dimension token profile, each dimension documented with
  its calculation basis; proxies are explicitly labeled.
- **Launch replay** — the first 60 seconds reconstructed from observed
  on-chain events, never synthetic.
- **Wallet intelligence** — parsed transaction history with transparent,
  observable-behavior labels; no identity claims.
- **MemeOS Analyst** — answers strictly from MEMEOS data, labeling every
  statement OBSERVED / CALCULATED / INTERPRETATION.

Data honesty is a product principle: live metrics carry their source and
timestamp, unavailable features say so, and demo data is always labeled.

## Features

- Intelligence workspace (`/terminal`) — market pulse, live signals, trending
  tokens with real Meme DNA scores, narrative pulse, live feed
- Live feed (`/live`), attention classification (`/attention`)
- Narratives (`/narratives`) with momentum ranking and detail reports
- Meme DNA (`/dna`) with historical evolution
- Wallet intelligence (`/wallets`) + evidence-backed wallet graph
- Launch archive and first-60-second replay (`/launches`)
- Creator intelligence (`/creators`), observed agent-like behavior (`/agents`)
- Persistent watchlists (`/watchlist`), global search (`/` or Ctrl-K)
- MemeOS Analyst (`/ai`) — Gemini LLM with deterministic rule-engine fallback
- Solana wallet connection gating the terminal — read-only, no signatures

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** design system (dark-first, violet/cyan signal identity)
- **Prisma** + PostgreSQL (Supabase) — snapshots, history, graph, watchlists
- **Vitest** — unit + integration tests, environment-gated live smoke tests
- Official logo system as generated SVG (`scripts/build-brand.mjs`)

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in what you have; demo mode works with none
node scripts/build-brand.mjs # regenerate brand SVGs (optional)
npm run dev
```

Open http://localhost:3000.

## Environment Variables

All variables are documented in **`.env.example`** — copy it to `.env.local`
and fill in what you need. Highlights:

| Variable | Required | Purpose |
| --- | --- | --- |
| `HELIUS_API_KEY` | live mode | wallet intelligence, launch replay, token metadata |
| `DATABASE_URL` | live mode | snapshot history, wallet graph, watchlists, agents |
| `MEMEOS_DEMO_MODE` | yes | `true` = demo data (labeled), `false` = live providers |
| `GEMINI_API_KEY` | optional | LLM MemeOS Analyst (rule engine works without it) |
| `BIRDEYE_API_KEY` | optional | observed holder counts for Meme DNA |

Server-only secrets are never exposed to the browser; the client talks only
to MEMEOS API routes.

## Data Providers

| Provider | Used for | Auth |
| --- | --- | --- |
| Helius | RPC, DAS metadata, Enhanced Transactions | `HELIUS_API_KEY` (server-side) |
| DexScreener | price, liquidity, volume, pairs | none (public API) |
| Pump.fun | launch discovery | none (public API) |
| Supabase/PostgreSQL | persistence | `DATABASE_URL` (server-side) |
| Gemini | LLM Analyst | `GEMINI_API_KEY` (server-side) |

No scraping. No unofficial endpoints.

## AI

The MemeOS Analyst has two engines behind one interface:

1. **Gemini** (`gemini-3.8-flash` via the Interactions API; `GEMINI_MODEL`
   overrides) — active when `GEMINI_API_KEY` is configured. Receives a
   fenced, injection-resistant context built from live MEMEOS data.
2. **Rule engine** — deterministic fallback, always available. Answers are
   labeled OBSERVED / CALCULATED / INTERPRETATION and the UI always shows
   which engine actually produced the response.

## Database

PostgreSQL (Supabase-compatible). Schema in `prisma/schema.prisma`: tokens,
token/attention/DNA snapshots, launches + launch events, wallets, wallet
activity, wallet relationships, narratives + narrative snapshots, creators,
agents, signals, watchlists — each row isolated by `sourceMode` (DEMO/LIVE).

Apply with `npx prisma db push` (uses `DATABASE_URL`).

## Wallet Support

Wallet Standard auto-detection plus explicit adapters (Phantom, Solflare,
Coinbase, Ledger, Torus). Connecting gates the terminal; MEMEOS is read-only
and never requests signatures or transactions.

## Testing

```bash
npm test                    # unit + integration (DB tests use DATABASE_URL)
RUN_LIVE_SMOKE=1 npm test   # + real provider connectivity probes
npm run typecheck           # tsc --noEmit
npm run lint                # eslint
npm run build               # production build
```

## Deployment Notes

- Any Node host or Vercel. Required server-side env vars are in
  `.env.example`; never prefix secrets with `NEXT_PUBLIC_`.
- Scheduled snapshot persistence: `POST /api/jobs/snapshot` (cron-friendly).
- `/api/health` reports real upstream connectivity (RPC, Helius, DexScreener,
  Pump.fun, database, LLM) — never a faked status.
