# MEMEOS — Opening X Post

## Primary post (266 / 280 characters)

```
MEMEOS is live.

Solana moves fast. Most people only see the meme. MEMEOS looks at what's moving underneath it.

Market activity, attention, wallet behavior, narratives, launches, token intelligence — one layer over all of it.

The Intelligence Layer for Solana Memes.
```

## Website URL — NOT included (intentionally)

No official domain is configured anywhere in the project (no `NEXT_PUBLIC_SITE_URL`,
none in `src/lib/config.ts`, `.env.local` or `.env.example`). Per the launch rule,
no domain was invented. Once the domain is live, append it as the final line:

```
<your-domain>
```

Suggested: add a `NEXT_PUBLIC_SITE_URL` field to `.env` + `src/lib/config.ts` when
the domain is registered, so all future posts/cards pull from config.

## Image asset

- File: `launch/memeos-opening-post.png` — 1600×900, PNG
- Source: `launch/memeos-opening-post.svg` (regenerate: render with `sharp`)
- Alt text (accessibility): "MEMEOS — The Intelligence Layer for Solana Memes. The
  official MEMEOS mark above the wordmark and tagline on a dark background."
- The official mark geometry and gradient are embedded verbatim from
  `public/brand/logo-mark.svg`; the MEMEOS wordmark is the official monoline
  vector from `public/brand/wordmark-dark.svg` (the ME·ME·OS grouping is
  intentional brand design — MEME OS).

## Pre-flight checklist

- [x] Image uses the official MEMEOS logo (exact path data + gradient, no reinterpretation)
- [x] MEMEOS spelling verified (mark aria-label + wordmark vector + statement text)
- [x] No CA (token CA is unset/TBA in config — none shown)
- [x] No statistics, user counts or unverifiable claims
- [x] No placeholder text in image or copy
- [x] 1600×900 verified via sharp metadata
- [x] Clean at thumbnail size (480×270 preview render checked)
- [x] No hashtags, no emojis, no banned phrases
