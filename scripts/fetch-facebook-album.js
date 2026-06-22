/**
 * Facebook Album → Website Gallery sync.
 *
 * Pulls every photo from the "Website Feed" album on the Neff Paving & Concrete
 * Facebook Page, downloads + optimizes any new ones into the local gallery, and
 * regenerates the gallery manifest. Designed to run unattended on a daily
 * GitHub Actions schedule so the business owner can post photos from his phone
 * and have them appear on neffpaving.co within 24 hours.
 *
 * Two-way sync: photos removed from the album are also removed from the site.
 *
 * Required environment:
 *   FB_PAGE_TOKEN   Long-lived Facebook Page access token (secret).
 * Optional environment:
 *   FB_ALBUM_ID     Album node ID (default: the "Website Feed" album).
 *   FB_API_VERSION  Graph API version (default: v21.0).
 *
 * Exit codes: 0 on success (with or without changes), non-zero on any failure.
 * On failure the manifest and existing images are left untouched, so a bad
 * token or network blip can never wipe the live gallery.
 */

import sharp from 'sharp';
import { mkdir, readdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const CONFIG = {
  token: process.env.FB_PAGE_TOKEN,
  albumId: process.env.FB_ALBUM_ID || '1458301069648156',
  apiVersion: process.env.FB_API_VERSION || 'v21.0',
  imageDir: join(REPO_ROOT, 'assets', 'gallery', 'facebook'),
  manifestPath: join(REPO_ROOT, 'src', 'data', 'facebook-images.js'),
  maxWidth: 1600,
  webpQuality: 82,
  filePrefix: 'fb-',
};

const DEFAULT_TITLE = 'Neff Paving & Concrete';
const DEFAULT_ALT = 'Recent paving, concrete, or excavation work by Neff Paving & Concrete';

/** @param {unknown} error @returns {string} */
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Fetch every photo in the album, following Graph API pagination.
 * @returns {Promise<Array<{ id: string, name?: string, created_time?: string, images?: Array<{ width: number, height: number, source: string }> }>>}
 */
async function fetchAlbumPhotos() {
  const base = `https://graph.facebook.com/${CONFIG.apiVersion}/${CONFIG.albumId}/photos`;
  const params = new URLSearchParams({
    fields: 'id,name,created_time,images',
    limit: '100',
    access_token: CONFIG.token,
  });

  /** @type {Array<object>} */
  const photos = [];
  let url = `${base}?${params.toString()}`;

  while (url) {
    const res = await fetch(url);
    const body = await res.json();

    if (!res.ok || body.error) {
      const detail = body.error ? `${body.error.type}: ${body.error.message}` : `HTTP ${res.status}`;
      throw new Error(`Graph API request failed — ${detail}`);
    }
    if (!Array.isArray(body.data)) {
      throw new Error('Graph API response missing "data" array — aborting to protect the live gallery.');
    }

    photos.push(...body.data);
    url = body.paging?.next || '';
  }

  return photos;
}

/**
 * Pick the highest-resolution variant Facebook offers for a photo.
 * @param {Array<{ width: number, height: number, source: string }>} [images]
 * @returns {string | null}
 */
function pickBestSource(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const best = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
  return best?.source || null;
}

/**
 * Turn a Facebook caption into a clean single-line title.
 * @param {string | undefined} name
 * @returns {string}
 */
function toTitle(name) {
  if (!name) return DEFAULT_TITLE;
  const firstLine = name.split('\n')[0].replace(/\s+/g, ' ').trim();
  if (!firstLine) return DEFAULT_TITLE;
  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}…` : firstLine;
}

/**
 * Download, optimize, and write a single photo as WebP.
 * @param {string} source @param {string} destPath
 */
async function downloadAndOptimize(source, destPath) {
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Image download failed (HTTP ${res.status})`);
  const input = Buffer.from(await res.arrayBuffer());

  const output = await sharp(input)
    .rotate() // respect EXIF orientation from phone uploads
    .resize({ width: CONFIG.maxWidth, withoutEnlargement: true })
    .webp({ quality: CONFIG.webpQuality })
    .toBuffer();

  await writeFile(destPath, output);
}

/**
 * Write the auto-generated gallery manifest consumed by gallery-filter.js.
 * @param {Array<{ filename: string, title: string, alt: string, date: string }>} entries
 */
async function writeManifest(entries) {
  // Sanitize remote (Facebook-sourced) text before persisting it to a source
  // module: strip control characters and angle brackets so the data can never
  // break out of its string/HTML context downstream.
  const clean = (v) => String(v ?? '').replace(/[\x00-\x1f\x7f<>]/g, '').trim();
  const safeEntries = entries.map((e) => ({
    filename: clean(e.filename),
    title: clean(e.title),
    alt: clean(e.alt),
    date: clean(e.date)
  }));

  const banner =
    '// AUTO-GENERATED by scripts/fetch-facebook-album.js — do not edit by hand.\n' +
    '// Synced daily from the "Website Feed" album on the Neff Paving & Concrete Facebook Page.\n' +
    `// Last sync produced ${safeEntries.length} image(s).\n\n`;
  const body = `export const facebookImages = ${JSON.stringify(safeEntries, null, 2)};\n`;
  await writeFile(CONFIG.manifestPath, banner + body, 'utf8');
}

/** Remove locally-cached photos that are no longer in the album. */
async function pruneRemovedPhotos(keepFilenames) {
  if (!existsSync(CONFIG.imageDir)) return;
  const existing = await readdir(CONFIG.imageDir);
  for (const file of existing) {
    if (!file.startsWith(CONFIG.filePrefix)) continue; // never touch unrelated files
    if (!keepFilenames.has(file)) {
      await rm(join(CONFIG.imageDir, file));
      console.log(`🗑️  Removed (deleted from album): ${file}`);
    }
  }
}

async function main() {
  if (!CONFIG.token) {
    throw new Error('FB_PAGE_TOKEN is not set. Configure it as a GitHub Actions secret.');
  }

  console.log(`🔄 Fetching album ${CONFIG.albumId} via Graph API ${CONFIG.apiVersion}…`);
  const photos = await fetchAlbumPhotos();
  console.log(`📷 Album contains ${photos.length} photo(s).`);

  await mkdir(CONFIG.imageDir, { recursive: true });

  // Newest first so the "Latest" filter surfaces fresh uploads.
  const sorted = [...photos].sort((a, b) => {
    const ta = a.created_time ? Date.parse(a.created_time) : 0;
    const tb = b.created_time ? Date.parse(b.created_time) : 0;
    return tb - ta;
  });

  /** @type {Array<{ filename: string, title: string, alt: string, date: string }>} */
  const manifest = [];
  const keepFilenames = new Set();
  let downloaded = 0;
  let skipped = 0;

  for (const photo of sorted) {
    const source = pickBestSource(photo.images);
    if (!source) {
      console.warn(`⚠️  Photo ${photo.id} has no usable image source — skipping.`);
      continue;
    }

    const filename = `${CONFIG.filePrefix}${photo.id}.webp`;
    const destPath = join(CONFIG.imageDir, filename);
    keepFilenames.add(filename);

    if (existsSync(destPath)) {
      skipped += 1;
    } else {
      try {
        await downloadAndOptimize(source, destPath);
        downloaded += 1;
        console.log(`⬇️  Downloaded ${filename}`);
      } catch (error) {
        // Skip this one image rather than failing the whole sync.
        console.warn(`⚠️  Could not process photo ${photo.id}: ${getErrorMessage(error)}`);
        keepFilenames.delete(filename);
        continue;
      }
    }

    const title = toTitle(photo.name);
    manifest.push({
      filename,
      title,
      alt: photo.name ? toTitle(photo.name) : DEFAULT_ALT,
      date: photo.created_time || '',
    });
  }

  await pruneRemovedPhotos(keepFilenames);
  await writeManifest(manifest);

  console.log(
    `✅ Sync complete — ${manifest.length} image(s) in gallery ` +
    `(${downloaded} new, ${skipped} unchanged).`
  );
}

main().catch((error) => {
  console.error(`❌ Facebook album sync failed: ${getErrorMessage(error)}`);
  process.exit(1);
});
