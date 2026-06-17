// Generates optimized brand + favicon assets from the master 1024x1024 source
// images in public/images. Re-run any time the logo/icon changes:
//   node scripts/generate-brand-assets.mjs
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const LOGO_SRC = 'brand/Neff-Paving-Logo.png'; // transparent crest (1024px master)
const ICON_SRC = 'brand/Neff-Paving-Icon.png'; // rounded app-icon tile (1024px master)

for (const f of [LOGO_SRC, ICON_SRC]) {
  if (!existsSync(f)) { throw new Error(`Missing source image: ${f}`); }
}

const png = (q = 90) => ({ compressionLevel: 9, quality: q, effort: 9 });

async function run() {
  // ---- Header / footer logo (transparent, crisp at retina) ----
  await sharp(LOGO_SRC)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png(png())
    .toFile('public/images/neff-logo.png');

  // ---- Browser favicons (keep transparency) ----
  await sharp(ICON_SRC).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(png()).toFile('public/favicon-16x16.png');
  await sharp(ICON_SRC).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(png()).toFile('public/favicon-32x32.png');
  await sharp(ICON_SRC).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(png()).toFile('public/favicon-192x192.png');

  // ---- Apple touch icon: iOS masks its own corners, so flatten on white ----
  await sharp(ICON_SRC)
    .resize(180, 180, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png(png())
    .toFile('public/apple-touch-icon.png');

  // ---- Multi-resolution favicon.ico via ImageMagick ----
  execFileSync('magick', [
    ICON_SRC, '-background', 'none', '-define', 'icon:auto-resize=16,32,48', 'public/favicon.ico',
  ], { stdio: 'inherit' });

  console.log('✅ Brand assets generated into public/');
}

run().catch((e) => { console.error(e); process.exit(1); });
