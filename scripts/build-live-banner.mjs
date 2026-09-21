/**
 * MEMEOS LIVE BANNER — "THE SIGNAL IS UNDERNEATH."
 * 1600×900 · chaos → signal → intelligence · official mark at the center.
 * Composition is NEW (radial convergence, not the hero's horizontal flows).
 * Run: node scripts/build-live-banner.mjs → public/images/memeos-live-original.png
 */
import sharp from "sharp";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const W = 1600;
const H = 900;
const CX = 800;
const CY = 400; // convergence point (mark sits here)
const OUT = join(process.cwd(), "public", "images");

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(845447);

let s = `<rect width="${W}" height="${H}" fill="#050608"/>`;
s += `<rect width="${W}" height="${H}" fill="url(#atmo)"/>`;

// ── chaos: scattered fragments, most dying into darkness ───────────────
for (let i = 0; i < 950; i++) {
  const x = rnd() * W;
  const y = rnd() * H;
  // thin out near the center — the pattern owns that space
  const dc = Math.hypot(x - CX, y - CY);
  if (dc < 190 && rnd() < 0.8) continue;
  const r = 0.6 + rnd() * 1.8;
  const tint = rnd();
  const fill = tint > 0.92 ? "#E9D5FF" : tint > 0.5 ? "#A855F7" : "#6D5BD0";
  s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" fill-opacity="${(0.05 + rnd() * 0.3).toFixed(2)}"/>`;
}
// dead traces: short paths that fade to nothing
for (let i = 0; i < 46; i++) {
  const x = rnd() * W;
  const y = rnd() * H;
  const dc = Math.hypot(x - CX, y - CY);
  if (dc < 220) continue;
  const a = rnd() * Math.PI * 2;
  const len = 20 + rnd() * 90;
  s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * len).toFixed(1)}" y2="${(y + Math.sin(a) * len).toFixed(1)}" stroke="#6D5BD0" stroke-opacity="${(0.06 + rnd() * 0.16).toFixed(2)}" stroke-width="1"/>`;
}

// ── convergence: curved trails from the edges into the center ──────────
for (let i = 0; i < 16; i++) {
  const edge = Math.floor(rnd() * 4);
  const spread = rnd();
  let x0, y0;
  if (edge === 0) { x0 = spread * W; y0 = -30; }
  else if (edge === 1) { x0 = W + 30; y0 = spread * H; }
  else if (edge === 2) { x0 = spread * W; y0 = H + 30; }
  else { x0 = -30; y0 = spread * H; }
  const mx = (x0 + CX) / 2 + (rnd() - 0.5) * 340;
  const my = (y0 + CY) / 2 + (rnd() - 0.5) * 240;
  s += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${CX} ${CY}" fill="none" stroke="url(#trail)" stroke-width="1.1" stroke-opacity="${(0.25 + rnd() * 0.3).toFixed(2)}"/>`;
  // points along the trail, brightening as they approach the center
  for (let t = 0.25; t < 0.97; t += 0.09 + rnd() * 0.08) {
    const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * CX;
    const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * CY;
    s += `<circle cx="${qx.toFixed(1)}" cy="${qy.toFixed(1)}" r="${(0.8 + t * 1.9).toFixed(2)}" fill="${t > 0.75 ? "#C084FC" : "#A855F7"}" fill-opacity="${(0.15 + t * 0.65).toFixed(2)}"/>`;
  }
}

// ── the pattern: precise reticle framing the intelligence point ────────
for (const r of [150, 205, 260]) {
  s += `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="#A855F7" stroke-opacity="${(0.16 - r / 4000).toFixed(3)}" stroke-width="1"/>`;
}
for (let a = 0; a < 12; a++) {
  const ang = (a / 12) * Math.PI * 2;
  const r1 = 205, r2 = 226;
  s += `<line x1="${(CX + Math.cos(ang) * r1).toFixed(1)}" y1="${(CY + Math.sin(ang) * r1).toFixed(1)}" x2="${(CX + Math.cos(ang) * r2).toFixed(1)}" y2="${(CY + Math.sin(ang) * r2).toFixed(1)}" stroke="#A855F7" stroke-opacity="0.22" stroke-width="1"/>`;
}
// glow under the mark
s += `<circle cx="${CX}" cy="${CY}" r="150" fill="url(#halo)"/>`;

s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient color-interpolation="sRGB" id="atmo" cx="0.5" cy="0.44" r="0.85">
      <stop offset="0" stop-color="#150A2E"/>
      <stop offset="0.5" stop-color="#0A0714"/>
      <stop offset="1" stop-color="#030405"/>
    </radialGradient>
    <radialGradient color-interpolation="sRGB" id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#A855F7" stop-opacity="0.55"/>
      <stop offset="0.7" stop-color="#7B61FF" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#7B61FF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient color-interpolation="sRGB" id="trail" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D5BD0" stop-opacity="0"/>
      <stop offset="1" stop-color="#C084FC" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  ${s}
</svg>
`;
writeFileSync(join(OUT, "memeos-live-original.svg"), s);
console.log("background written");

const markSvg = readFileSync(join(process.cwd(), "public", "brand", "memeos-mark.svg"), "utf8");
const wordSvg = readFileSync(join(process.cwd(), "public", "brand", "wordmark.svg"), "utf8");

const markBuf = await sharp(Buffer.from(markSvg)).resize(232, 123).png().toBuffer();
const wordBuf = await sharp(Buffer.from(wordSvg)).resize(300, 68).png().toBuffer();

const typeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
  <text x="800" y="640" text-anchor="middle" font-family="Arial, 'Segoe UI', sans-serif" font-size="30" font-weight="600" letter-spacing="14" fill="#E9D5FF">THE SIGNAL IS UNDERNEATH.</text>
  <text x="800" y="688" text-anchor="middle" font-family="Arial, 'Segoe UI', sans-serif" font-size="15" letter-spacing="7" fill="#8B7CC8">THE INTELLIGENCE LAYER FOR SOLANA MEMES.</text>
</svg>`;

await sharp(Buffer.from(s))
  .composite([
    { input: markBuf, left: CX - 116, top: CY - 62 },
    { input: wordBuf, left: CX - 150, top: CY + 92 },
    { input: Buffer.from(typeSvg), left: 0, top: 0 },
  ])
  .png()
  .toFile(join(OUT, "memeos-live-original.png"));
console.log("wrote memeos-live-original.png (1600x900)");
