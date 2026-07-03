import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupByFamily,
  filterSprites,
  listVariants,
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

test('filterSprites filters by variant', () => {
  const result = filterSprites(sprites, { variant: 'gold' });
  assert.deepEqual(result.map((s) => s.id), ['4']);
});

test('filterSprites combines variant with missingOnly', () => {
  const result = filterSprites(sprites, { variant: 'base', missingOnly: true, ownedIds: new Set(['1']) });
  assert.deepEqual(result.map((s) => s.id), ['5']);
});

test('listVariants returns distinct variants in first-seen order', () => {
  assert.deepEqual(listVariants(sprites), ['base', 'gold']);
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
