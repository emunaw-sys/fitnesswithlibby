/**
 * Rebuilds the site's WebP images.
 *
 *   sources -> assets/source/*.png   (full-size originals, never deployed)
 *   output  -> public/*.webp         (what the site actually serves)
 *
 * Run after replacing any source PNG:  node scripts/optimize-images.mjs
 *
 * width = the widest the image is ever displayed at in CSS px, doubled for
 * retina. Nothing is ever upscaled past the source.
 */
import sharp from 'sharp';
import { statSync } from 'fs';

const SRC_DIR = 'assets/source';
const OUT_DIR = 'public';

const jobs = [
  { file: 'hero-final',            width: 1536, quality: 82 }, // full-bleed hero, LCP
  { file: 'libby',                 width: 1000, quality: 82 }, // portrait, seen up close
  { file: 'personal-training',     width: 1600 },
  { file: 'last-section',          width: 1600 },
  { file: 'style-strengthen-tone', width: 1200 },
  { file: 'style-step',            width: 1200 },
  { file: 'style-pilates',         width: 1000 },
  { file: 'calendar-3d',           width: 480 },
  { file: 'dumbbells',             width: 480 },
  { file: 'logo-libby-black',      width: 200 },
];

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
let origTotal = 0;
let webpTotal = 0;

for (const { file, width, quality = 78 } of jobs) {
  const src = `${SRC_DIR}/${file}.png`;
  const orig = statSync(src).size;
  const { width: srcWidth } = await sharp(src).metadata();
  const w = Math.min(width, srcWidth);

  await sharp(src)
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(`${OUT_DIR}/${file}.webp`);

  const webp = statSync(`${OUT_DIR}/${file}.webp`).size;
  origTotal += orig;
  webpTotal += webp;

  console.log(file.padEnd(24), `${srcWidth}->${w}`.padEnd(13), 'png' + kb(orig), ' webp' + kb(webp));
}

console.log('\n' + 'TOTAL'.padEnd(25) + ''.padEnd(13), 'png' + kb(origTotal), ' webp' + kb(webpTotal));
