/**
 * Builds the favicon set from the circular "f" watermark.
 *
 *   source -> assets/source/watermark-black.svg
 *   output -> app/favicon.ico    (16/32/48, what browsers request by default)
 *             app/icon.png       (512, high-DPI tabs + Android)
 *             app/apple-icon.png (180, iOS home screen)
 *
 * Next.js picks these up automatically from app/ and emits the <link> tags,
 * so there is no metadata config to keep in sync.
 *
 * Two adjustments are worth knowing about:
 *
 * 1. The artwork ships with wide margins (content is ~58% of the canvas). We
 *    trim to the mark and re-pad, otherwise it renders small and lost.
 * 2. The double ring and the f are hairlines. Straight downscaling washes them
 *    to pale grey, so the alpha channel gets a gamma curve that thickens what
 *    antialiasing thinned — hardest at 16px, tapering off as size grows, and
 *    off entirely at 180px+ where the art is faithful on its own.
 *
 * Run:  node scripts/generate-favicon.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const SRC = 'assets/source/watermark-black.svg';
const BG = '#FFFFFF';
const INSET = 0.86;

// Render the vector large once, then trim the surrounding margin.
const mark = await sharp(SRC, { density: 96 })
  .resize({ width: 1600 })
  .png()
  .toBuffer()
  .then((b) => sharp(b).trim().png().toBuffer());

/** Darken antialiased edges so hairline strokes survive being shrunk. */
async function thicken(buf, gamma) {
  if (!gamma) return buf;
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.round(255 * Math.pow(data[i] / 255, gamma)));
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function icon(size, gamma) {
  const box = Math.round(size * INSET);
  const scaled = await sharp(mark)
    .resize({ width: box, height: box, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: await thicken(scaled, gamma), gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Pack PNGs into an .ico container (PNG-in-ICO, read by every current browser). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

// Smaller icons need more stroke compensation than larger ones.
const ICO = [
  { size: 16, gamma: 0.55 },
  { size: 32, gamma: 0.7 },
  { size: 48, gamma: 0.8 },
];

const icoImages = [];
for (const { size, gamma } of ICO) {
  icoImages.push({ size, data: await icon(size, gamma) });
}
writeFileSync('app/favicon.ico', buildIco(icoImages));
writeFileSync('app/icon.png', await icon(512, null));
writeFileSync('app/apple-icon.png', await icon(180, null));

const m = await sharp(mark).metadata();
console.log(`mark: ${m.width}x${m.height} (trimmed from 1254x1254)`);
console.log(`app/favicon.ico    ${ICO.map((i) => i.size).join('/')}px`);
console.log('app/icon.png       512px');
console.log('app/apple-icon.png 180px');
