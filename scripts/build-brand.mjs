/**
 * MEMEOS BRAND GENERATOR — OFFICIAL MARK (exact vector reconstruction).
 *
 * Geometry (from the official logo, 845×447 canvas):
 *   - Three ascending vertical-walled masses on one flat baseline.
 *   - Mass 1 (left): plain block, flat top.
 *   - Mass 2 (middle): flat top, concave valley arc down its top-right into
 *     the tall mass, bottom-right carved by a concave arch hugging the tall
 *     mass's left edge.
 *   - Mass 3 (tall): apex top-left, outer edge is one large convex arc
 *     sweeping to the baseline; bottom-left carved by the concave hook
 *     (cusp inside the mass, widening down-right).
 *   - Negative space: two white arches between the masses (the M valleys).
 *   - Gradient: indigo (bottom-left) → bright orchid (middle) → deep violet
 *     (apex). Purple/violet only — no cyan.
 *
 * This is the EXACT official symbol — vectorized for scalability, not
 * reinterpreted. Run: node scripts/build-brand.mjs → public/brand/*.svg
 */
import { writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "brand");
mkdirSync(OUT, { recursive: true });

/** ── Official mark geometry (845×447) ─────────────────────────────────── */
const MARK_PATHS = [
  // Mass 1 — left block
  "M0 237 H150 V447 H0 Z",
  // Mass 2 — middle: notch valley (top-right) + carved arch (bottom-right)
  "M150 79 H265 Q275 215 355 240 V282 Q255 300 210 447 H150 Z",
  // Mass 3 — tall: convex outer arc + carved hook
  "M355 0 A490 447 0 0 1 845 447 H565 Q490 285 448 233 V447 H355 Z",
];

const GRAD = (id, stops) =>
  `<linearGradient color-interpolation="sRGB" id="${id}" x1="0" y1="1" x2="0.85" y2="0">
    ${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("\n    ")}
  </linearGradient>`;

const DARK_STOPS = [
  ["0", "#7C6AF0"],
  ["0.35", "#A855F7"],
  ["0.62", "#C13FE4"],
  ["1", "#43104F"],
];
const LIGHT_STOPS = [
  ["0", "#6D28D9"],
  ["0.5", "#7E22CE"],
  ["0.78", "#9333EA"],
  ["1", "#3B0764"],
];

const markBody = (paint) => MARK_PATHS.map((d) => `<path d="${d}" fill="${paint}"/>`).join("\n  ");

const svg = (w, h, defs, body, label = "MEMEOS") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">\n  ${defs}${body}\n</svg>\n`;

const write = (name, content) => {
  writeFileSync(join(OUT, name), content);
  console.log("wrote", name);
};

/** ── Official mark variants (exact geometry, color-only changes) ──────── */
write(
  "memeos-mark.svg",
  svg(845, 447, `<defs>${GRAD("mo", DARK_STOPS)}</defs>\n  `, markBody("url(#mo)"))
);
write(
  "memeos-mark-dark.svg",
  svg(845, 447, `<defs>${GRAD("mod", DARK_STOPS)}</defs>\n  `, markBody("url(#mod)"))
);
write(
  "memeos-mark-light.svg",
  svg(845, 447, `<defs>${GRAD("mol", LIGHT_STOPS)}</defs>\n  `, markBody("url(#mol)"))
);
write("memeos-mark-mono-white.svg", svg(845, 447, "", markBody("#FFFFFF")));
write("memeos-mark-mono-black.svg", svg(845, 447, "", markBody("#0B0D10")));

/** ── Wordmark (monoline MEMEOS, 70.4×16 — unchanged, exact) ───────────── */
const W_SW = 2.1;
const wordmarkPaths = [
  "M 1 14.5 V 1.5 L 6 8 L 11 1.5 V 14.5",
  "M 18.5 1.5 H 11 V 14.5 H 18.5 M 11 8 H 16.5",
  "M 25.5 14.5 V 1.5 L 30.5 8 L 35.5 1.5 V 14.5",
  "M 43 1.5 H 35.5 V 14.5 H 43 M 35.5 8 H 41",
  "M 53 1.7 C 55.8 1.7 57.4 3.2 57.4 8 C 57.4 12.8 55.8 14.3 53 14.3 C 50.2 14.3 48.6 12.8 48.6 8 C 48.6 3.2 50.2 1.7 53 1.7 Z",
  "M 68.4 3.4 C 68.4 1.9 67 1.5 64.8 1.5 C 62.7 1.5 61.3 2.3 61.3 4 C 61.3 5.9 63 6.4 64.7 6.9 C 66.5 7.4 68.3 7.9 68.3 10 C 68.3 12.3 66.8 14.5 64.7 14.5 C 62.5 14.5 61.2 13.4 61.2 11.8",
];
const wordmarkBody = (stroke) =>
  `<g fill="none" stroke="${stroke}" stroke-width="${W_SW}" stroke-linecap="round" stroke-linejoin="round">
    ${wordmarkPaths.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>`;
const WM_W = 70.4;

write("wordmark.svg", svg(WM_W, 16, "", wordmarkBody("#F2F4F8")));
write("wordmark-dark.svg", svg(WM_W, 16, "", wordmarkBody("#F2F4F8")));
write("wordmark-light.svg", svg(WM_W, 16, "", wordmarkBody("#3B1D8F")));
write("wordmark-mono-black.svg", svg(WM_W, 16, "", wordmarkBody("#0B0D10")));

/** ── Lockups, favicon, social, animated ───────────────────────────────── */
// Horizontal lockup: mark (44 tall) + wordmark at matching cap height.
{
  const mkH = 44;
  const wmH = 10; // wordmark cap height visually matches 44-tall mark
  const wmScale = wmH / 16;
  const wmW = WM_W * wmScale;
  const gap = 16;
  const total = mkH * (845 / 447) + gap + wmW; // mark width at 44 tall
  const body =
    `<g transform="translate(0,0) scale(${(mkH / 447).toFixed(4)})">${markBody("url(#lh)")}</g>\n  ` +
    `<g transform="translate(${(mkH * (845 / 447) + gap).toFixed(1)},${((mkH - wmH) / 2).toFixed(1)}) scale(${wmScale.toFixed(4)})">${wordmarkBody("#F2F4F8")}</g>`;
  write(
    "logo-horizontal.svg",
    svg(Number(total.toFixed(1)), mkH, `<defs>${GRAD("lh", DARK_STOPS)}</defs>\n  `, body)
  );
}

// Stacked lockup: mark on top, wordmark centered below.
{
  const mkW = 260;
  const mkScale = mkW / 845;
  const mkH = 447 * mkScale;
  const wmScale = 30 / 16;
  const wmW = WM_W * wmScale;
  const body =
    `<g transform="scale(${mkScale.toFixed(4)})">${markBody("url(#ls)")}</g>\n  ` +
    `<g transform="translate(${((mkW - wmW) / 2).toFixed(1)},${(mkH + 18).toFixed(1)}) scale(${wmScale.toFixed(4)})">${wordmarkBody("#F2F4F8")}</g>`;
  write(
    "logo-stacked.svg",
    svg(mkW, (mkH + 18 + 30).toFixed(0), `<defs>${GRAD("ls", DARK_STOPS)}</defs>\n  `, body)
  );
}

// Favicon / app icon: the EXACT whole mark, width-fit into a square
// (no crop, no redesign), vertically centered, transparent background.
{
  const s = 64 / 845;
  const h = 447 * s; // ≈ 33.8
  const body = `<g transform="scale(${s.toFixed(5)}) translate(0,${((64 / s - 447) / 2).toFixed(1)})">${markBody("url(#mf)")}</g>`;
  write("favicon.svg", svg(64, 64, `<defs>${GRAD("mf", DARK_STOPS)}</defs>\n  `, body));
}

// Social avatar: exact whole mark centered, scaled for circular crop.
{
  const s = 56 / 845;
  const scaledW = 845 * s; // 56
  const scaledH = 447 * s;
  const ty = ((64 - scaledH) / 2).toFixed(1);
  const tx = ((64 - scaledW) / 2).toFixed(1);
  const body = `<g transform="translate(${tx},${ty}) scale(${s.toFixed(5)})">${markBody("url(#ms)")}</g>`;
  write("social-avatar.svg", svg(64, 64, `<defs>${GRAD("ms", DARK_STOPS)}</defs>\n  `, body));
}

// Animated: identical geometry, outer arc edge pulse (reduced-motion safe).
write(
  "logo-animated.svg",
  svg(
    845,
    447,
    `<defs>${GRAD("mn", DARK_STOPS)}</defs>
  <style>
    @media (prefers-reduced-motion: no-preference) {
      .m-outer { animation: m-pulse 2.6s ease-in-out infinite; }
      @keyframes m-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.82; } }
    }
  </style>
  `,
    `<path d="${MARK_PATHS[0]}" fill="url(#mn)"/>
  <path d="${MARK_PATHS[1]}" fill="url(#mn)"/>
  <path d="${MARK_PATHS[2]}" fill="url(#mn)" class="m-outer"/>`
  )
);

/** ── Requested canonical filenames ────────────────────────────────────── */
const pairs = [
  ["memeos-mark.svg", "logo-mark.svg"],
  ["memeos-mark-dark.svg", "logo-mark-dark.svg"],
  ["memeos-mark-light.svg", "logo-mark-light.svg"],
  ["memeos-mark.svg", "memeos-logo.svg"],
  ["memeos-mark-dark.svg", "memeos-logo-dark.svg"],
  ["memeos-mark-light.svg", "memeos-logo-light.svg"],
];
for (const [src, dest] of pairs) {
  copyFileSync(join(OUT, src), join(OUT, dest));
  console.log("wrote", dest);
}

console.log("done.");
