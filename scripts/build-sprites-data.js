// scripts/build-sprites-data.js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseSpriteCards } from './parse-sprites-html.js';

const SOURCE_HTML = new URL('../data/raw/fortnite-sprites-source.html', import.meta.url);
const OUTPUT_JSON = new URL('../data/sprites.json', import.meta.url);
const IMAGES_DIR = new URL('../assets/sprites/', import.meta.url);
const IMAGE_BASE_URL = 'https://fortnite.gg';

async function main() {
  const html = await readFile(SOURCE_HTML, 'utf8');
  const sprites = parseSpriteCards(html);
  console.log(`Parsed ${sprites.length} sprites`);

  const invalid = sprites.filter((s) => !s.id || !s.name || !s.family || !s.variant || !s.rarity || !s.image);
  if (invalid.length > 0) {
    throw new Error(
      `${invalid.length} sprite record(s) failed to parse completely: ${JSON.stringify(invalid, null, 2)}`
    );
  }

  await mkdir(IMAGES_DIR, { recursive: true });

  const records = [];
  for (const sprite of sprites) {
    const localImagePath = `assets/sprites/${sprite.id}.webp`;
    await downloadImage(`${IMAGE_BASE_URL}${sprite.image}`, new URL(`${sprite.id}.webp`, IMAGES_DIR));
    records.push({ ...sprite, image: localImagePath });
    console.log(`Downloaded ${sprite.name} -> ${localImagePath}`);
  }

  await writeFile(OUTPUT_JSON, JSON.stringify(records, null, 2) + '\n');
  console.log(`Wrote ${records.length} records to data/sprites.json`);
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
