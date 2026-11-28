// 実在店舗（カードショップ）の検索用データを作る。
// 出典: OpenStreetMap (ODbL)。Overpass API から取得する。
// 実行: node scripts/fetch-shops.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const UA = 'wantandwallet-dev/0.1 (personal; shop import)';

const QUERIES = [
  // カード専門店
  `[out:json][timeout:60];
area["ISO3166-1"="JP"][admin_level=2]->.a;
node["shop"="collector"](area.a);
out tags center;`,
  // おもちゃ屋のうちカード・ホビー系
  `[out:json][timeout:60];
area["ISO3166-1"="JP"][admin_level=2]->.a;
node["shop"="toys"]["name"~"カード|トレカ|トレーディング|ホビー|遊戯王"](area.a);
out tags center;`,
  // ゲーム店のうちカード系（負荷が高いので名前で絞る）
  `[out:json][timeout:60];
area["ISO3166-1"="JP"][admin_level=2]->.a;
node["shop"="games"]["name"~"カード|トレカ|遊戯王"](area.a);
out tags center;`,
];

async function runQuery(ql, attempts = 3) {
  const url = `${ENDPOINT}?data=${encodeURIComponent(ql)}`;
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.elements ?? [];
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw lastErr;
}

const byKey = new Map();
for (const ql of QUERIES) {
  try {
    const elements = await runQuery(ql);
    for (const el of elements) {
      const tags = el.tags ?? {};
      if (!tags.name) continue;
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const key = `${tags.name}|${lat?.toFixed(5)}|${lon?.toFixed(5)}`;
      if (byKey.has(key)) continue;
      const addrParts = [
        tags['addr:province'],
        tags['addr:city'],
        tags['addr:suburb'],
        tags['addr:street'],
        tags['addr:housenumber'],
      ].filter(Boolean);
      byKey.set(key, {
        id: `${el.type}/${el.id}`,
        name: tags.name,
        address: addrParts.join(' '),
        lat: lat ?? null,
        lon: lon ?? null,
        website: tags.website ?? tags['contact:website'] ?? '',
        shop: tags.shop ?? '',
      });
    }
    console.log(`ok: ${elements.length} elements`);
  } catch (e) {
    console.warn(`skip query (${e.message})`);
  }
  // Overpass への配慮
  await new Promise((r) => setTimeout(r, 1500));
}

const shops = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
const payload = {
  generatedAt: new Date().toISOString(),
  source: 'OpenStreetMap contributors',
  license: 'ODbL 1.0',
  note: 'OSM のカード系店舗タグから抽出。網羅性は保証されません。',
  shops,
};

mkdirSync('public/data', { recursive: true });
if (shops.length === 0) {
  console.error('no shops fetched; keeping existing data');
  process.exitCode = 1;
} else {
  writeFileSync('public/data/shops.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`wrote ${shops.length} shops`);
}
