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
