# MEMEOS BRAND SYSTEM — OFFICIAL MARK

The official MEMEOS symbol is the provided ascending three-mass mark,
vectorized EXACTLY (no reinterpretation):

- Three vertical-walled masses rising left-to-right on one flat baseline.
- Left mass: plain block, flat top.
- Middle mass: flat top; concave valley arc descending its top-right into
  the tall mass; bottom-right carved by a concave arch hugging the tall
  mass's left edge.
- Tall mass: apex top-left; outer edge is one large convex arc sweeping to
  the baseline; bottom-left carved by the concave hook (cusp inside the
  mass, widening down-right).
- Two white arches form the negative space between the masses.
- Gradient: indigo (#7C6AF0, bottom-left) -> bright orchid (#C13FE4) ->
  deep violet (#43104F, apex). Purple/violet family only.

Canonical generator: `node scripts/build-brand.mjs` (regenerates every SVG
from one geometry source). React components:
`src/components/brand/memeos-logo.tsx` (`MemeosMark`, `MemeosWordmark`).

## Assets (all transparent-background vector SVG)

| Asset | Files |
| --- | --- |
| Mark (gradient, primary) | `memeos-mark.svg`, `memeos-mark-dark.svg`, `logo-mark.svg`, `logo-mark-dark.svg`, `memeos-logo.svg`, `memeos-logo-dark.svg` |
| Mark (light backgrounds) | `memeos-mark-light.svg`, `logo-mark-light.svg`, `memeos-logo-light.svg` |
| Mark (monochrome) | `memeos-mark-mono-white.svg`, `memeos-mark-mono-black.svg` |
| Wordmark (monoline MEMEOS) | `wordmark.svg`, `wordmark-dark.svg`, `wordmark-light.svg`, `wordmark-mono-black.svg` |
| Lockups | `logo-horizontal.svg`, `logo-stacked.svg` |
| Favicon / app icon | `favicon.svg` (+ `src/app/icon.svg`) |
| Social avatar (circular-crop safe) | `social-avatar.svg` |
| Animated (subtle, reduced-motion safe) | `logo-animated.svg` |
| Tagline (removable, not part of the mark) | "The Intelligence Layer for Solana Memes." |

PNG exports (1024/512/256/128/64) are intentionally not bundled - no
rasterizer in the toolchain; export from the SVGs when a platform requires
raster. Geometry is FIXED: only color treatment varies between variants.
