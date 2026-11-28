// Konami カードゲームネットワークの店舗検索から店舗情報を取得する（個人利用）。
// 実行: node scripts/fetch-konami-shops.mjs
// 出力: public/data/shops.json（.gitignore 対象。各自の環境で生成する）
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://cardgame-network.konami.net/mt/user';
const UA = 'wantandwallet/0.1 (personal store import)';
const PAGE_SIZE = 20;
const MAX_PAGES = 40;

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const pick = (xml, tag) => {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? decode(m[1]).trim() : '';
};

async function getXml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/xml' } });
  if (!res.ok) throw new Error(`GET ${url} ${res.status}`);
  return res.text();
}

async function postXml(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.text();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const statesXml = await getXml(`${BASE}/rest/state/JP`);
const states = [...statesXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
  code: pick(m[1], 'stateCode'),
  name: pick(m[1], 'stateName'),
}));
console.log(`states: ${states.length}`);

const shops = new Map();
for (const state of states) {
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = {
      address: null,
      storeName: null,
      states: [state.code],
      nationCodes: ['JP'],
      typeRanks: null,
      eventMasterPresents: null,
      nationGroupCode: 'JP',
      page,
    };
    let xml;
    try {
      xml = await postXml('/rest/store/JP/searchStores', body);
    } catch (e) {
      console.warn(`skip ${state.name} page ${page}: ${e.message}`);
      break;
    }
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    for (const item of items) {
      const code = pick(item, 'storeCode');
      if (!code || shops.has(code)) continue;
      shops.set(code, {
        id: code,
        name: pick(item, 'storeName'),
        address: pick(item, 'fullAddress'),
        state: pick(item, 'stateName'),
        tel: pick(item, 'telNo4UserPage'),
        url: pick(item, 'storeUrl'),
        lat: Number(pick(item, 'latitude')) || null,
        lon: Number(pick(item, 'longitude')) || null,
        typeRank: pick(item, 'typeRank'),
      });
    }
    if (items.length < PAGE_SIZE) break;
    await sleep(200);
  }
  await sleep(200);
  console.log(`${state.name}: total ${shops.size}`);
}

const list = [...shops.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
const payload = {
  generatedAt: new Date().toISOString(),
  source: 'Konami カードゲームネットワーク 店舗検索',
  sourceUrl: 'https://cardgame-network.konami.net/store_search',
  note: '個人利用の範囲で取得。再配布しないこと。',
  count: list.length,
  shops: list,
};

mkdirSync('public/data', { recursive: true });
if (list.length === 0) {
  console.error('no shops fetched; keeping existing data');
  process.exitCode = 1;
} else {
  writeFileSync('public/data/shops.json', JSON.stringify(payload) + '\n', 'utf8');
  console.log(`wrote ${list.length} shops`);
}
