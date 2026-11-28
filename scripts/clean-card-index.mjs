// 既存の cards-index.json を整形する（ruby タグ除去・読みの抽出）。
// 通常は build-card-index.mjs が同じ整形を行うため、再生成でもよい。
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'public/data/cards-index.json';
const j = JSON.parse(readFileSync(path, 'utf8'));

const strip = (s) =>
  s
    .replace(/<ruby>([\s\S]*?)<rt>[\s\S]*?<\/rt><\/ruby>/g, '$1')
    .replace(/<[^>]+>/g, '');
const toKana = (s) =>
  s
    .replace(/<ruby>([\s\S]*?)<rt>([\s\S]*?)<\/rt><\/ruby>/g, '$2')
    .replace(/<[^>]+>/g, '');

j.cards = j.cards
  .map((r) => [r[0], r[1], strip(r[2]), r[3], r[4], r[5], toKana(r[2])])
  .filter((r) => r[2]);

j.count = j.cards.length;
writeFileSync(path, JSON.stringify(j), 'utf8');
console.log('rows', j.cards.length, 'bytes', Buffer.byteLength(JSON.stringify(j)));
