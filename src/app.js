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
  const isOwned = ownedIds.has(sprite.id);
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'sprite-card' + (isOwned ? ' owned' : '');
  card.setAttribute('aria-label', `${sprite.name}, ${isOwned ? 'vlastníš' : 'nevlastníš'}`);
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
  })
  .catch((err) => {
    els.groups.textContent = 'Nepodařilo se načíst data spritů. Zkontroluj připojení a zkus to znovu.';
    console.error('Failed to load data/sprites.json', err);
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
