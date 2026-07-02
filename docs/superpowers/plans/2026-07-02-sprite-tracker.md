# Sprite Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, installable, offline-first PWA that lists all 82 Fortnite Creature Sprites (grouped by family, with rarity/search/filter), lets the user tap to mark them owned, persists progress locally, supports JSON backup/restore, and is hosted on GitHub Pages so it can be added to the iPhone home screen.

**Architecture:** Pure static site (no framework, no bundler). A one-time Node build script parses a locally saved HTML snapshot of fortnite.gg/sprites into `data/sprites.json` and downloads the 82 sprite images into `assets/sprites/`. The browser app (`index.html` + `src/app.js` + `style.css`) fetches that JSON at runtime, renders the grouped grid, and stores owned/unowned state in `localStorage`. A service worker caches the app shell and all images for full offline use. Deployed via GitHub Pages from the `main` branch of a new public repo `Upskify/fortnite-sprite-tracker`.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (ES modules), Node.js 25 (built-in test runner and `fetch`, used only for the build script and tests — never shipped to the browser), GitHub Pages, `gh` CLI (already authenticated as `Upskify`), `ffmpeg`/`dwebp` (already installed via Homebrew, used once to generate app icons).

---

## File structure

```
fortnite-sprite-tracker/
├── package.json                  # type: module, test script
├── .nojekyll                     # tells GitHub Pages not to run Jekyll
├── index.html                    # app shell
├── style.css                     # dark theme styles
├── manifest.webmanifest          # PWA manifest
├── service-worker.js             # offline caching
├── data/
│   ├── raw/
│   │   └── fortnite-sprites-source.html   # saved snapshot (build input)
│   └── sprites.json               # generated: 82 sprite records
├── assets/
│   └── sprites/                   # generated: 82 .webp images
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── scripts/
│   ├── parse-sprites-html.js      # pure HTML → sprite records parser
│   └── build-sprites-data.js      # runs the parser + downloads images
├── src/
│   ├── sprite-logic.js            # pure filter/group/progress/backup functions
│   └── app.js                     # DOM wiring, fetch, localStorage, events
└── tests/
    ├── parse-sprites-html.test.js
    └── sprite-logic.test.js
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `.nojekyll`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "fortnite-sprite-tracker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "build:data": "node scripts/build-sprites-data.js",
    "serve": "python3 -m http.server 8080"
  }
}
```

- [ ] **Step 2: Create `.nojekyll` (empty file)**

```bash
touch .nojekyll
```

- [ ] **Step 3: Create `.gitignore`**

```
.DS_Store
node_modules/
```

- [ ] **Step 4: Commit**

```bash
git add package.json .nojekyll .gitignore
git commit -m "chore: scaffold project"
```

---

### Task 2: Copy the raw data snapshot into the repo

**Files:**
- Create: `data/raw/fortnite-sprites-source.html`

- [ ] **Step 1: Copy the file the user downloaded**

```bash
mkdir -p data/raw
cp "/Users/jirikucera/Downloads/Fortnite Sprites - Fortnite.GG.html" "data/raw/fortnite-sprites-source.html"
```

- [ ] **Step 2: Verify it contains sprite cards**

```bash
grep -c "class='sprite-card'" data/raw/fortnite-sprites-source.html
```

Expected: `82`

- [ ] **Step 3: Commit**

```bash
git add data/raw/fortnite-sprites-source.html
git commit -m "chore: add raw sprite data snapshot"
```

---

### Task 3: HTML parser with tests

**Files:**
- Create: `scripts/parse-sprites-html.js`
- Test: `tests/parse-sprites-html.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/parse-sprites-html.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpriteCards } from '../scripts/parse-sprites-html.js';

const fixture = `<div class='sprite-card' data-sprite='1' data-parent='Water' data-rarity='rare' data-variant='base' data-owned='0' data-level='-1'><a class='sprite-art' href='/sprites/1-water-sprite'><img src='/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Water_Unvault_Ch7S3_ui_L.webp' loading='lazy' alt='Water Sprite'></a><div class='sprite-body'><a class='sprite-name' href='/sprites/1-water-sprite'>Water Sprite</a><div class='sprite-meta'><span class='sprite-pill sprite-rarity-rare'>rare</span><span class='sprite-pill'>12.83%</span><span class='sprite-pill'>Starter</span></div><div class='sprite-readonly-level'>Not owned</div></div></div><div class='sprite-card' data-sprite='4' data-parent='Water' data-rarity='special' data-variant='gold' data-owned='0' data-level='-1'><a class='sprite-art' href='/sprites/4-gold-water-sprite'><img src='/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Water_Gold_ui_L.webp' loading='lazy' alt='Gold Water Sprite'></a><div class='sprite-body'><a class='sprite-name' href='/sprites/4-gold-water-sprite'>Gold Water Sprite</a><div class='sprite-meta'><span class='sprite-pill sprite-rarity-special'>special</span><span class='sprite-pill'>0.7%</span></div><div class='sprite-readonly-level'>Not owned</div></div></div>`;

test('parses two sprite cards with all fields', () => {
  const result = parseSpriteCards(fixture);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    id: '1',
    name: 'Water Sprite',
    family: 'Water',
    variant: 'base',
    rarity: 'rare',
    chancePercent: 12.83,
    isStarter: true,
    image: '/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Water_Unvault_Ch7S3_ui_L.webp',
  });
  assert.deepEqual(result[1], {
    id: '4',
    name: 'Gold Water Sprite',
    family: 'Water',
    variant: 'gold',
    rarity: 'special',
    chancePercent: 0.7,
    isStarter: false,
    image: '/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Water_Gold_ui_L.webp',
  });
});

test('returns empty array for html with no sprite cards', () => {
  assert.deepEqual(parseSpriteCards('<div>no cards here</div>'), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/parse-sprites-html.test.js`
Expected: FAIL (`Cannot find module '../scripts/parse-sprites-html.js'`)

- [ ] **Step 3: Write the implementation**

```javascript
// scripts/parse-sprites-html.js
export function parseSpriteCards(html) {
  const startIndexes = [];
  const cardStartRe = /<div class='sprite-card'/g;
  let match;
  while ((match = cardStartRe.exec(html)) !== null) {
    startIndexes.push(match.index);
  }
  if (startIndexes.length === 0) return [];
  startIndexes.push(html.length);

  const items = [];
  for (let i = 0; i < startIndexes.length - 1; i++) {
    const chunk = html.slice(startIndexes[i], startIndexes[i + 1]);
    items.push(parseOneCard(chunk));
  }
  return items;
}

function parseOneCard(chunk) {
  const attr = (name) => {
    const m = chunk.match(new RegExp(`${name}='([^']*)'`));
    return m ? m[1] : null;
  };
  const imgMatch = chunk.match(/<img src='([^']*)'/);
  const nameMatch = chunk.match(/class='sprite-name'[^>]*>([^<]*)</);
  const pills = [...chunk.matchAll(/sprite-pill'>([^<]*)</g)].map((m) => m[1]);
  const chanceText = pills.find((p) => p.includes('%')) || '0%';

  return {
    id: attr('data-sprite'),
    name: nameMatch ? nameMatch[1] : null,
    family: attr('data-parent'),
    variant: attr('data-variant'),
    rarity: attr('data-rarity'),
    chancePercent: parseFloat(chanceText.replace('%', '')),
    isStarter: pills.includes('Starter'),
    image: imgMatch ? imgMatch[1] : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/parse-sprites-html.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/parse-sprites-html.js tests/parse-sprites-html.test.js
git commit -m "feat: add sprite HTML parser"
```

---

### Task 4: Build script — generate sprites.json and download images

**Files:**
- Create: `scripts/build-sprites-data.js`

- [ ] **Step 1: Write the script**

```javascript
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
```

- [ ] **Step 2: Run it**

```bash
npm run build:data
```

Expected output: `Parsed 82 sprites`, 82 `Downloaded ...` lines, `Wrote 82 records to data/sprites.json`

- [ ] **Step 3: Verify the output**

```bash
node -e "const d = JSON.parse(require('fs').readFileSync('data/sprites.json')); console.log(d.length, d[0])"
ls assets/sprites | wc -l
```

Expected: `82 { id: ... }` and `82`

- [ ] **Step 4: Commit**

```bash
git add scripts/build-sprites-data.js data/sprites.json assets/sprites/
git commit -m "feat: generate sprites.json and download sprite images"
```

---

### Task 5: Pure sprite logic (filter, group, progress, backup) with tests

**Files:**
- Create: `src/sprite-logic.js`
- Test: `tests/sprite-logic.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/sprite-logic.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupByFamily,
  filterSprites,
  computeProgress,
  serializeBackup,
  parseBackup,
} from '../src/sprite-logic.js';

const sprites = [
  { id: '1', name: 'Water Sprite', family: 'Water', variant: 'base', rarity: 'rare', chancePercent: 12.83, isStarter: true, image: 'a.webp' },
  { id: '4', name: 'Gold Water Sprite', family: 'Water', variant: 'gold', rarity: 'special', chancePercent: 0.7, isStarter: false, image: 'b.webp' },
  { id: '5', name: 'Earth Sprite', family: 'Earth', variant: 'base', rarity: 'rare', chancePercent: 12.83, isStarter: true, image: 'c.webp' },
];

test('groupByFamily groups in first-seen order', () => {
  const groups = groupByFamily(sprites);
  assert.deepEqual(groups.map((g) => g.family), ['Water', 'Earth']);
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[1].items.length, 1);
});

test('filterSprites filters by case-insensitive name query', () => {
  const result = filterSprites(sprites, { query: 'gold' });
  assert.deepEqual(result.map((s) => s.id), ['4']);
});

test('filterSprites filters by rarity', () => {
  const result = filterSprites(sprites, { rarity: 'special' });
  assert.deepEqual(result.map((s) => s.id), ['4']);
});

test('filterSprites missingOnly excludes owned ids', () => {
  const result = filterSprites(sprites, { missingOnly: true, ownedIds: new Set(['1']) });
  assert.deepEqual(result.map((s) => s.id), ['4', '5']);
});

test('filterSprites with no options returns everything', () => {
  const result = filterSprites(sprites, {});
  assert.equal(result.length, 3);
});

test('computeProgress counts owned vs total', () => {
  const result = computeProgress(sprites, new Set(['1', '4']));
  assert.deepEqual(result, { owned: 2, total: 3 });
});

test('serializeBackup then parseBackup round-trips owned ids', () => {
  const ownedIds = new Set(['4', '1']);
  const json = serializeBackup(ownedIds);
  const parsed = parseBackup(json);
  assert.deepEqual([...parsed].sort(), ['1', '4']);
});

test('parseBackup rejects invalid json shape', () => {
  assert.throws(() => parseBackup('{"nope": true}'), /Invalid backup file/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sprite-logic.test.js`
Expected: FAIL (`Cannot find module '../src/sprite-logic.js'`)

- [ ] **Step 3: Write the implementation**

```javascript
// src/sprite-logic.js
export function groupByFamily(sprites) {
  const order = [];
  const byFamily = new Map();
  for (const sprite of sprites) {
    if (!byFamily.has(sprite.family)) {
      byFamily.set(sprite.family, []);
      order.push(sprite.family);
    }
    byFamily.get(sprite.family).push(sprite);
  }
  return order.map((family) => ({ family, items: byFamily.get(family) }));
}

export function filterSprites(sprites, { query = '', rarity = '', missingOnly = false, ownedIds = new Set() } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  return sprites.filter((sprite) => {
    if (normalizedQuery && !sprite.name.toLowerCase().includes(normalizedQuery)) return false;
    if (rarity && sprite.rarity !== rarity) return false;
    if (missingOnly && ownedIds.has(sprite.id)) return false;
    return true;
  });
}

export function computeProgress(sprites, ownedIds) {
  const total = sprites.length;
  const owned = sprites.filter((sprite) => ownedIds.has(sprite.id)).length;
  return { owned, total };
}

export function serializeBackup(ownedIds) {
  return JSON.stringify({ ownedIds: [...ownedIds].sort() }, null, 2);
}

export function parseBackup(json) {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.ownedIds)) {
    throw new Error('Invalid backup file: missing ownedIds array');
  }
  return new Set(data.ownedIds.map(String));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sprite-logic.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests across both files PASS

- [ ] **Step 6: Commit**

```bash
git add src/sprite-logic.js tests/sprite-logic.test.js
git commit -m "feat: add pure sprite filter/group/progress/backup logic"
```

---

### Task 6: App shell HTML and dark theme CSS

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sprite Tracker</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Sprite Tracker">
<meta name="theme-color" content="#15171c">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <h1>Sprite Tracker</h1>
  <div class="controls-row">
    <input id="search" type="text" placeholder="Hledat sprita" autocomplete="off">
    <select id="rarity-filter">
      <option value="">Všechny rarity</option>
      <option value="rare">Rare</option>
      <option value="epic">Epic</option>
      <option value="legendary">Legendary</option>
      <option value="mythic">Mythic</option>
      <option value="special">Special</option>
    </select>
  </div>
  <div class="controls-row controls-row-between">
    <label class="checkbox-label"><input id="missing-only" type="checkbox"> Jen chybějící</label>
    <span id="progress-text">0 / 0 nasbíráno</span>
  </div>
  <div class="progress-bar"><div id="progress-fill"></div></div>
</header>
<main id="sprite-groups"></main>
<footer>
  <button id="export-btn" type="button">Export zálohy</button>
  <button id="import-btn" type="button">Import zálohy</button>
  <input id="import-file" type="file" accept="application/json" hidden>
</footer>
<script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `style.css`**

```css
:root {
  color-scheme: dark;
  --bg: #15171c;
  --surface: #1e2129;
  --border: #2a2d35;
  --text: #e6e8ec;
  --text-muted: #a9adb8;
  --owned: #1D9E75;
  --rare: #85B7EB;
  --epic: #7F77DD;
  --legendary: #EF9F27;
  --mythic: #D4537E;
  --special: #b4b2a9;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  padding-bottom: 72px;
}

header {
  position: sticky;
  top: 0;
  background: var(--bg);
  padding: 14px 16px 10px;
  border-bottom: 0.5px solid var(--border);
  z-index: 10;
}

h1 { font-size: 16px; font-weight: 500; margin: 0 0 10px; }

.controls-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.controls-row-between { justify-content: space-between; align-items: center; }

#search, #rarity-filter {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 8px 10px;
  font-size: 13px;
}

#search { flex: 1; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

#progress-text { font-size: 12px; color: var(--text-muted); }

.progress-bar {
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

#progress-fill {
  height: 100%;
  background: var(--owned);
  width: 0%;
  transition: width 0.2s ease;
}

main { padding: 14px 16px; max-width: 640px; margin: 0 auto; }

main h2 {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
}

.sprite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.sprite-card {
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px;
  position: relative;
  text-align: left;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  opacity: 0.55;
}

.sprite-card.owned {
  border-color: rgba(47, 119, 193, 0.3);
  opacity: 1;
}

.sprite-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: var(--border);
  border-radius: 8px;
  margin-bottom: 6px;
  display: block;
}

.sprite-name { font-size: 11px; font-weight: 500; margin-bottom: 4px; }

.sprite-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
}

.rarity { padding: 2px 5px; border-radius: 4px; color: var(--bg); }
.rarity-rare { background: var(--rare); }
.rarity-epic { background: var(--epic); }
.rarity-legendary { background: var(--legendary); }
.rarity-mythic { background: var(--mythic); }
.rarity-special { background: var(--special); }

.chance { color: var(--text-muted); }

.sprite-card.owned::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--owned);
  color: #04342C;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg);
  border-top: 0.5px solid var(--border);
}

footer button {
  flex: 1;
  background: var(--surface);
  border: 0.5px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat: add app shell and dark theme styles"
```

---

### Task 7: App logic — render, filter, toggle, backup

**Files:**
- Create: `src/app.js`

- [ ] **Step 1: Write `src/app.js`**

```javascript
// src/app.js
import { groupByFamily, filterSprites, computeProgress, serializeBackup, parseBackup } from './sprite-logic.js';

const STORAGE_KEY = 'sprite-tracker:owned';

function loadOwnedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveOwnedIds(ownedIds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedIds]));
}

let sprites = [];
let ownedIds = loadOwnedIds();

const els = {
  search: document.getElementById('search'),
  rarity: document.getElementById('rarity-filter'),
  missingOnly: document.getElementById('missing-only'),
  groups: document.getElementById('sprite-groups'),
  progressText: document.getElementById('progress-text'),
  progressFill: document.getElementById('progress-fill'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFile: document.getElementById('import-file'),
};

function render() {
  const filtered = filterSprites(sprites, {
    query: els.search.value,
    rarity: els.rarity.value,
    missingOnly: els.missingOnly.checked,
    ownedIds,
  });

  els.groups.innerHTML = '';
  for (const { family, items } of groupByFamily(filtered)) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = family;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'sprite-grid';
    for (const sprite of items) grid.appendChild(renderCard(sprite));
    section.appendChild(grid);

    els.groups.appendChild(section);
  }

  const { owned, total } = computeProgress(sprites, ownedIds);
  els.progressText.textContent = `${owned} / ${total} nasbíráno`;
  els.progressFill.style.width = total ? `${Math.round((owned / total) * 100)}%` : '0%';
}

function renderCard(sprite) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'sprite-card' + (ownedIds.has(sprite.id) ? ' owned' : '');
  card.innerHTML = `
    <img src="${sprite.image}" alt="${sprite.name}" loading="lazy">
    <div class="sprite-name">${sprite.name}</div>
    <div class="sprite-meta">
      <span class="rarity rarity-${sprite.rarity}">${sprite.rarity}</span>
      <span class="chance">${sprite.chancePercent}%</span>
    </div>
  `;
  card.addEventListener('click', () => {
    if (ownedIds.has(sprite.id)) ownedIds.delete(sprite.id);
    else ownedIds.add(sprite.id);
    saveOwnedIds(ownedIds);
    render();
  });
  return card;
}

function exportBackup() {
  const json = serializeBackup(ownedIds);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sprite-tracker-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      ownedIds = parseBackup(reader.result);
      saveOwnedIds(ownedIds);
      render();
    } catch (err) {
      alert('Neplatný soubor zálohy: ' + err.message);
    }
  };
  reader.readAsText(file);
}

els.search.addEventListener('input', render);
els.rarity.addEventListener('change', render);
els.missingOnly.addEventListener('change', render);
els.exportBtn.addEventListener('click', exportBackup);
els.importBtn.addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', () => {
  const file = els.importFile.files[0];
  if (file) importBackup(file);
  els.importFile.value = '';
});

fetch('data/sprites.json')
  .then((res) => res.json())
  .then((data) => {
    sprites = data;
    render();
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
```

- [ ] **Step 2: Manually verify in a browser**

```bash
npm run serve
```

Open `http://localhost:8080` in a desktop browser. Verify:
- All 18 family sections render with their sprite variants
- Clicking a card toggles the green owned checkmark and updates the progress counter
- Typing in the search box filters by name
- The rarity dropdown filters correctly
- "Jen chybějící" hides owned sprites
- Reloading the page keeps the previously toggled sprites owned (localStorage persisted)
- "Export zálohy" downloads a `sprite-tracker-backup.json` file
- Clearing localStorage (`localStorage.clear()` in devtools console) then using "Import zálohy" with the exported file restores the owned state

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: wire up rendering, filtering, and backup in the browser"
```

---

### Task 8: PWA manifest and icons

**Files:**
- Create: `manifest.webmanifest`
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/apple-touch-icon.png`

- [ ] **Step 1: Generate the icon source image**

Pick a sprite already downloaded in Task 4 (the golden king sprite) and flatten it onto the app's dark background at 512x512:

```bash
mkdir -p icons
dwebp assets/sprites/9.webp -o /tmp/icon-src.png
ffmpeg -y -f lavfi -i color=c=0x15171c:s=512x512 -i /tmp/icon-src.png \
  -filter_complex "[1:v]scale=400:400[fg];[0:v][fg]overlay=(W-w)/2:(H-h)/2" \
  -frames:v 1 icons/icon-512.png
```

If `assets/sprites/9.webp` does not exist (ids depend on the parse order), list the directory first (`ls assets/sprites`) and substitute any `.webp` filename from that list.

- [ ] **Step 2: Resize down to the other required sizes**

```bash
ffmpeg -y -i icons/icon-512.png -vf scale=192:192 icons/icon-192.png
ffmpeg -y -i icons/icon-512.png -vf scale=180:180 icons/apple-touch-icon.png
```

- [ ] **Step 3: Verify the files**

```bash
file icons/icon-192.png icons/icon-512.png icons/apple-touch-icon.png
```

Expected: three `PNG image data` lines with dimensions 192x192, 512x512, 180x180

- [ ] **Step 4: Write `manifest.webmanifest`**

```json
{
  "name": "Sprite Tracker",
  "short_name": "Sprite Tracker",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#15171c",
  "theme_color": "#15171c",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add manifest.webmanifest icons/
git commit -m "feat: add PWA manifest and app icons"
```

---

### Task 9: Offline service worker

**Files:**
- Create: `service-worker.js`

- [ ] **Step 1: Write `service-worker.js`**

```javascript
const CACHE_NAME = 'sprite-tracker-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './src/app.js',
  './src/sprite-logic.js',
  './manifest.webmanifest',
  './data/sprites.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      const res = await fetch('./data/sprites.json');
      const sprites = await res.json();
      await cache.addAll(sprites.map((sprite) => sprite.image));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      return cached || fetch(event.request);
    })()
  );
});
```

- [ ] **Step 2: Manually verify offline support**

```bash
npm run serve
```

In desktop Chrome/Safari devtools: open `http://localhost:8080`, reload once (so the service worker installs and caches everything), then in DevTools → Network set "Offline", then reload the page again. Expected: app still loads fully with all images, filters still work.

- [ ] **Step 3: Commit**

```bash
git add service-worker.js
git commit -m "feat: add offline-caching service worker"
```

---

### Task 10: Push to GitHub and enable Pages

**Files:** none (repo-level operations)

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create Upskify/fortnite-sprite-tracker --public --source=. --remote=origin
```

- [ ] **Step 2: Push the code**

```bash
git push -u origin main
```

- [ ] **Step 3: Enable GitHub Pages from the `main` branch root**

```bash
gh api -X POST repos/Upskify/fortnite-sprite-tracker/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

If it responds with an error saying Pages is already configured, use PUT instead:

```bash
gh api -X PUT repos/Upskify/fortnite-sprite-tracker/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

- [ ] **Step 4: Wait for the Pages build and verify the URL responds**

```bash
sleep 30
curl -sI https://upskify.github.io/fortnite-sprite-tracker/ | head -1
```

Expected: `HTTP/2 200`. If it's still `404`, wait another 30 seconds and retry — first Pages deploys can take a couple of minutes.

- [ ] **Step 5: Manually verify on the iPhone**

Open `https://upskify.github.io/fortnite-sprite-tracker/` in Safari on the iPhone. Confirm the grid renders with images. Tap the Share button → "Add to Home Screen". Open the app from the home screen icon, confirm it opens full-screen without Safari chrome. Turn on Airplane Mode and relaunch the app from the home screen icon — confirm it still loads and images still show.

---

## Post-implementation notes

- Re-running `npm run build:data` regenerates `data/sprites.json` and re-downloads images if fortnite.gg ever updates its sprite list — commit and push the changes, GitHub Pages redeploys automatically on push to `main`.
- To bump the offline cache after any app-shell change, increment `CACHE_NAME` in `service-worker.js` (e.g. `sprite-tracker-v2`) so old caches are evicted on next visit.
