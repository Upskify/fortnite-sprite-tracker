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

export function filterSprites(sprites, { query = '', rarity = '', variant = '', missingOnly = false, ownedIds = new Set() } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  return sprites.filter((sprite) => {
    if (normalizedQuery && !sprite.name.toLowerCase().includes(normalizedQuery)) return false;
    if (rarity && sprite.rarity !== rarity) return false;
    if (variant && sprite.variant !== variant) return false;
    if (missingOnly && ownedIds.has(sprite.id)) return false;
    return true;
  });
}

export function listVariants(sprites) {
  const seen = new Set();
  const order = [];
  for (const sprite of sprites) {
    if (!seen.has(sprite.variant)) {
      seen.add(sprite.variant);
      order.push(sprite.variant);
    }
  }
  return order;
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
