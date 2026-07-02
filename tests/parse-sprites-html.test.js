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
