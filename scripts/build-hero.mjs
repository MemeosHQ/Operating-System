/**
 * MEMEOS HERO ARTWORK GENERATOR — "finding structure inside chaos".
 *
 * A dark digital field: hundreds of tiny activity points drifting along an
 * invisible flow structure. Some signals converge into bright clusters, a few
 * align into an ascending path, motion trails streak between them. Abstract,
 * deterministic, brand-colored (near-black / violet / orchid / cyan whisper).
 *
 * Outputs (identical composition):
 *   public/images/memeos-hero-original.svg  (vector master)
 *   public/images/memeos-hero-original.png  (1600×900, via sharp)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT = join(process.cwd(), "public", "images");
mkdirSync(OUT, { recursive: true });

const W = 1600;
const H = 900;

/** Deterministic PRNG (fixed seed → identical artwork every run). */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260921);

/** Flow field: layered sine curves — the "invisible structure". */
function flowY(x, layer) {
  return (
    H * 0.5 +
    Math.sin(x * 0.0016 + layer * 1.7) * (150 + layer * 55) +
    Math.sin(x * 0.0007 + layer * 0.9) * 90
  );
}

/** Signal clusters — where activity converges. */
const NODES = [
  { x: 1140, y: 285, r: 120, bright: 1 },
  { x: 820, y: 470, r: 90, bright: 0.7 },
  { x: 1310, y: 585, r: 70, bright: 0.5 },
];

let s = "";
s += `<rect width="${W}" height="${H}" fill="#050608"/>`;
// atmosphere
s += `<rect width="${W}" height="${H}" fill="url(#atmo)"/>`;

// invisible flow structure — faint layered curves
for (let layer = 0; layer < 7; layer++) {
  let d = `M -40 ${flowY(0, layer).toFixed(1)}`;
  for (let x = 0; x <= W + 40; x += 80) d += ` L ${x} ${flowY(x, layer).toFixed(1)}`;
  s += `<path d="${d}" fill="none" stroke="#7B61FF" stroke-opacity="${(0.045 + layer * 0.012).toFixed(3)}" stroke-width="1"/>`;
}

// drifting points along the flows
for (let i = 0; i < 620; i++) {
  const x = rnd() * W;
  const layer = Math.floor(rnd() * 7);
  const y = flowY(x, layer) + (rnd() - 0.5) * 26;
  const r = 0.7 + rnd() * 1.7;
  const tint = rnd();
  const fill = tint > 0.94 ? "#67E8F9" : tint > 0.45 ? "#A855F7" : "#7B61FF";
  const o = 0.12 + rnd() * 0.5;
  s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" fill-opacity="${o.toFixed(2)}"/>`;
}

// convergence: denser bright clusters around the signal nodes
for (const n of NODES) {
  s += `<circle cx="${n.x}" cy="${n.y}" r="${n.r * 1.9}" fill="url(#halo)" opacity="${(0.5 * n.bright).toFixed(2)}"/>`;
  const count = Math.round(90 * n.bright);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.6) * n.r;
    const x = n.x + Math.cos(a) * d;
    const y = n.y + Math.sin(a) * d * 0.62;
    const r = 0.9 + rnd() * 2.1;
    const fill = rnd() > 0.75 ? "#C084FC" : "#A855F7";
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" fill-opacity="${(0.35 + rnd() * 0.6).toFixed(2)}"/>`;
  }
  // core
  s += `<circle cx="${n.x}" cy="${n.y}" r="2.6" fill="#E9D5FF"/>`;
}

// motion trails — signals moving fast between clusters
for (let i = 0; i < 26; i++) {
  const n1 = NODES[Math.floor(rnd() * NODES.length)];
  const x1 = n1.x + (rnd() - 0.5) * n1.r;
  const y1 = n1.y + (rnd() - 0.5) * n1.r * 0.6;
  const len = 40 + rnd() * 130;
  const dir = rnd() > 0.5 ? 1 : -1;
  const o = (0.15 + rnd() * 0.35).toFixed(2);
  s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1 + len * dir).toFixed(1)}" y2="${(y1 + (rnd() - 0.5) * 12).toFixed(1)}" stroke="${rnd() > 0.7 ? "#67E8F9" : "#A855F7"}" stroke-opacity="${o}" stroke-width="1"/>`;
}

// the formed pattern — points aligning into an ascending path (structure found)
{
  const steps = 7;
  let d = `M 240 ${H - 210}`;
  for (let i = 0; i < steps; i++) {
    const x = 240 + i * 118;
    const y = H - 210 - i * 52 - Math.sin(i) * 8;
    d += ` L ${x} ${y}`;
  }
  s += `<path d="${d}" fill="none" stroke="#A855F7" stroke-opacity="0.35" stroke-width="1.4"/>`;
  for (let i = 0; i <= steps; i++) {
    const x = 240 + i * 118;
    const y = H - 210 - i * 52 - Math.sin(i) * 8;
    s += `<circle cx="${x}" cy="${y}" r="${3.2 + i * 0.5}" fill="#C084FC" fill-opacity="${(0.5 + i * 0.07).toFixed(2)}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${(8 + i * 1.6).toFixed(1)}" fill="#A855F7" fill-opacity="0.08"/>`;
  }
}

s = svgWrap(s);
function svgWrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient color-interpolation="sRGB" id="atmo" cx="0.72" cy="0.3" r="1">
      <stop offset="0" stop-color="#14082E"/>
      <stop offset="0.55" stop-color="#0A0714"/>
      <stop offset="1" stop-color="#050608"/>
    </radialGradient>
    <radialGradient color-interpolation="sRGB" id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#A855F7" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#A855F7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${body}
</svg>
`;
}

writeFileSync(join(OUT, "memeos-hero-original.svg"), s);
console.log("wrote memeos-hero-original.svg");

await sharp(Buffer.from(s)).png({ quality: 92 }).toFile(join(OUT, "memeos-hero-original.png"));
console.log("wrote memeos-hero-original.png (1600×900)");
