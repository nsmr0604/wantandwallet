// 遊戯王OCG 公式商品ページから新弾情報（発売日・定価・パック数）を取得する。
// 実行: node scripts/fetch-releases.mjs
// 出力: public/data/releases.json（.gitignore 対象）
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

const LIST = 'https://www.yugioh-card.com/japan/products/';
const UA = 'wantandwallet/0.1 (personal releases)';

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`GET ${url} ${res.status}`);
  return res.text();
};

const parsePrice = (text) => {
  if (!text) return { unit: null, price: null };
  const m = /1(パック|ボックス)\s*([\d,]+)円/.exec(text);
  if (m) {
    return {
      unit: m[1] === 'パック' ? 'pack' : 'box',
      price: Number(m[2].replaceAll(',', '')),
    };
  }
  const fallback = /([\d,]+)円/.exec(text);
  return { unit: null, price: fallback ? Number(fallback[1].replaceAll(',', '')) : null };
};

const parseDate = (text) => {
  if (!text) return '';
  const m = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(text);
  if (!m) return '';
  return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
};

const html = await get(LIST);
const objects = [...html.matchAll(/p\[\d+\]\s*=\s*(\{[\s\S]*?\});/g)].map((m) => m[1]);
console.log(`products in list: ${objects.length}`);

const products = [];
for (const raw of objects) {
  let obj;
  try {
    // 公式ページは限定的にシングルクォート（例: "limited":'jumpfesta'）を含む
    obj = JSON.parse(raw.replace(/:\s*'([^']*)'/g, ':"$1"'));
  } catch {
    continue;
  }
  const name = decode(obj.title ?? '').trim();
  if (!name) continue;
  const date = parseDate(obj['release-date']);
  const price = parsePrice(obj['price-intax']);
  const item = {
    name,
    date,
    kind: decode(obj['class-name'] ?? ''),
    detail: obj.detail ?? '',
    url: obj.url ? `https://www.yugioh-card.com/japan/products/${obj.url}/` : '',
    priceUnit: price.unit,
    price: price.price,
    packsPerBox: null,
    cardsPerPack: null,
  };

  if (item.url && obj.detail === 'page' && (!item.date || item.date >= '2025-01-01')) {
    try {
      const detail = await get(item.url);
      const pb = /(\d+)\s*パック入り/.exec(detail);
      const cpMatches = [...detail.matchAll(/1パック[：:\s]*(\d+)\s*枚入り/g)].map((m) => Number(m[1]));
      const cp = cpMatches.length ? Math.max(...cpMatches) : null;
      if (pb) item.packsPerBox = Number(pb[1]);
      if (cp) item.cardsPerPack = cp;
    } catch (e) {
      console.warn(`detail failed: ${name} (${e.message})`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  products.push(item);
}

products.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

const payload = {
  generatedAt: new Date().toISOString(),
  source: '遊戯王OCG 公式商品ページ',
  sourceUrl: LIST,
  note: '発売日・定価・パック数は公式ページの記載。変更される場合がある。',
  count: products.length,
  products,
};

mkdirSync('public/data', { recursive: true });
if (products.length === 0) {
  if (!existsSync('public/data/releases.json')) {
    console.error('no products fetched and no existing data');
    process.exitCode = 1;
  } else {
    console.error('no products fetched; keeping existing data');
  }
} else {
  writeFileSync('public/data/releases.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`wrote ${products.length} products`);
}
