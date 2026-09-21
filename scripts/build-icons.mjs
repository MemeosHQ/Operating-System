/**
 * MEMEOS FAVICON / APP ICON GENERATOR.
 *
 * Renders the EXACT official mark (public/brand/memeos-mark.svg — geometry
 * fixed, no redesign) to production raster assets:
 *   src/app/icon.png         512×512 (Next App Router file convention)
 *   src/app/apple-icon.png   180×180
 *   src/app/favicon.ico      16+32+48 (PNG-compressed ICO, hand-assembled)
 *   public/brand/icon-{16,32,48,64,128,256,512}.png
 *
 * Whole mark, width-fit, vertically centered, transparent background.
 * Run after build-brand.mjs:  node scripts/build-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BRAND = join(process.cwd(), "public", "brand");
const APP = join(process.cwd(), "src", "app");
const SVG = join(BRAND, "memeos-mark.svg");
const PADDING = 0.06; // small breathing room inside each square

async function renderPng(size) {
  const canvas = Math.round(size);
  const markW = Math.round(canvas * (1 - PADDING));
  const markH = Math.round((markW * 447) / 845);
  const left = Math.round((canvas - markW) / 2);
  const top = Math.round((canvas - markH) / 2);
  return sharp(SVG, { density: (72 * size) / 44 })
    .resize(markW, markH)
    .toBuffer()
    .then((mark) =>
      sharp({
        create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: mark, left, top }])
        .png()
        .toBuffer()
    );
}

async function main() {
  // Square PNGs (transparent background).
  for (const size of [16, 32, 48, 64, 128, 256, 512]) {
    const png = await renderPng(size);
    writeFileSync(join(BRAND, `icon-${size}.png`), png);
    console.log("wrote icon-" + size + ".png");
  }

  // Next.js App Router file conventions.
  writeFileSync(join(APP, "icon.png"), await renderPng(512));
  console.log("wrote src/app/icon.png (512)");
  writeFileSync(join(APP, "apple-icon.png"), await renderPng(180));
  console.log("wrote src/app/apple-icon.png (180)");

  // Multi-size favicon.ico — Vista+ ICO with embedded PNG entries.
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => renderPng(s)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(sizes.length, 4);
  const entries = [];
  let offset = 6 + sizes.length * 16;
  pngs.forEach((png, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0); // width
    e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  });
  writeFileSync(join(APP, "favicon.ico"), Buffer.concat([header, ...entries, ...pngs]));
  console.log("wrote src/app/favicon.ico (16+32+48)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
