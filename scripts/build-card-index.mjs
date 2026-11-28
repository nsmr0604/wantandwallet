// yaml-yugi の全カードから日本語名の検索索引を作る（個人利用）。
// 実行: node scripts/build-card-index.mjs
// 出力: public/data/cards-index.json（.gitignore 対象）
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'https://dawnbrandbots.github.io/yaml-yugi/cards.json';
const UA = 'wantandwallet/0.1 (personal card index)';

console.log('downloading cards.json ...');
const res = await fetch(URL, { headers: { 'User-Agent': UA } });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
console.log(`cards: ${data.length}`);

const rows = [];
const strip = (s) =>
  s
    .replace(/<ruby>([\s\S]*?)<rt>[\s\S]*?<\/rt><\/ruby>/g, '$1')
    .replace(/<[^>]+>/g, '');
const toKana = (s) =>
  s
    .replace(/<ruby>([\s\S]*?)<rt>([\s\S]*?)<\/rt><\/ruby>/g, '$2')
    .replace(/<[^>]+>/g, '');

for (const c of data) {
  const raw = c?.name?.ja;
  if (!raw) continue;
  const nameJa = strip(raw);
  if (!nameJa) continue;
  rows.push([
    c.konami_id ?? null,
    c.password ?? null,
    nameJa,
    c.name?.en ?? '',
    c.card_type ?? '',
    c.name?.ja_romaji ?? '',
    toKana(raw),
  ]);
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'yaml-yugi (DawnbrandBots)',
  sourceUrl: 'https://dawnbrandbots.github.io/yaml-yugi/cards.json',
  note: '日本語名を持つ OCG カードの索引。個人利用の範囲で生成する。',
  count: rows.length,
  cards: rows,
};

mkdirSync('public/data', { recursive: true });
if (rows.length === 0) {
  console.error('no cards; keeping existing index');
  process.exitCode = 1;
} else {
  writeFileSync('public/data/cards-index.json', JSON.stringify(payload), 'utf8');
  console.log(`wrote ${rows.length} cards`);
}
