// 遊戯王OCG 公式商品ページから新弾情報（発売日・定価・パック数）を取得する。
// 実行: node scripts/fetch-releases.mjs
// 出力: public/data/releases.json（.gitignore 対象）
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

const LIST = 'https://www.yugioh-card.com/japan/products/';
const DB_LIST = 'https://www.db.yugioh-card.com/yugiohdb/card_list.action?request_locale=ja';
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

// 公式カードDBの商品一覧（日本語名・カテゴリ）
let dbRows = [];
try {
  const dbHtml = await get(DB_LIST);
  const blocks = dbHtml.split('<div class="t_row').slice(1);
  for (const b of blocks) {
    const d = /<div class="time">\s*([^<]+?)\s*<\/div>/.exec(b);
    const c = /<span class="ws_nowrap">【([^】]+)】<\/span>/.exec(b);
    const n = /<p>([\s\S]*?)<\/p>/.exec(b);
    if (!d || !n) continue;
    const full = decode(n[1].replace(/<[^>]+>/g, '').trim());
    const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(full);
    dbRows.push({
      date: d[1].trim().replaceAll('/', '-'),
      category: c ? c[1] : '',
      nameJa: m ? m[1].trim() : full,
      nameEn: m ? m[2].trim() : '',
    });
  }
  console.log(`db products: ${dbRows.length}`);
} catch (e) {
  console.warn(`db list failed: ${e.message}`);
}

const key = (s) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]/g, '');
const dbByEn = new Map();
for (const row of dbRows) {
  if (row.nameEn) dbByEn.set(key(row.nameEn), row);
}

const kindToCategory = {
  基本パック: '基本ブースターパック',
  コンセプトパック: 'その他ブースターパック',
  スペシャルパック: 'その他ブースターパック',
  構築済みデッキ: '構築済みデッキ',
  スペシャルセット: '商品同梱',
  デュエリストアイテム: 'グッズ',
};

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
  const kind = decode(obj['class-name'] ?? '');
  const db = dbByEn.get(key(name));
  const item = {
    name,
    nameJa: db?.nameJa ?? '',
    category: db?.category ?? kindToCategory[kind] ?? kind,
    date,
    kind,
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
