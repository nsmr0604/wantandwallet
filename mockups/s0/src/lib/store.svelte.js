import { purchases, reservations, wishItems, releases } from './sample.js';

// モック専用の画面間状態（保存はしない・リロードで初期化）
const seed = [
  ...purchases.map((p) => ({
    ...p,
    itemType: p.unit === 'single' ? 'card' : 'sealed',
    status: 'bought',
    expectedAt: '',
    reservedAt: '',
    rarity: p.rarity || '',
    date: p.date || '',
    productKey: p.unit === 'single' ? '' : p.name,
    packs: p.unit === 'box' ? 30 : '',
    packsPerUnit: p.unit === 'box' ? 30 : 1,
    totalPacks: p.unit === 'box' ? 30 * p.qty : p.qty,
  })),
  ...reservations.map((r) => ({
    id: `r${r.id}`,
    itemType: 'sealed',
    name: r.name,
    productKey: r.name,
    unit: r.unit,
    qty: r.qty,
    unitPrice: r.unitPrice,
    shipping: 0,
    store: r.store,
    status: 'reserved',
    reservedAt: r.reservedAt,
    expectedAt: r.expectedAt,
    category: r.category || '新弾',
    rarity: '',
    date: r.reservedAt,
    packs: r.unit === 'box' ? 30 : 1,
    packsPerUnit: r.unit === 'box' ? 30 : 1,
    totalPacks: r.unit === 'box' ? 30 * r.qty : r.qty,
  })),
];

export const shop = $state({
  entries: seed,
  tab: 'all',
  draft: null,
  selectedId: null,
});

let seq = 100;
const nextId = () => {
  seq += 1;
  return `n${seq}`;
};

export const unitLabel = { single: '単品', pack: 'パック', box: 'BOX' };

export function setTab(tab) {
  shop.tab = tab;
}

export function blankDraft(kind = 'single') {
  shop.draft = {
    id: nextId(),
    itemType: kind === 'single' ? 'card' : 'sealed',
    name: '',
    productKey: '',
    unit: kind,
    qty: 1,
    packs: kind === 'single' ? '' : 1,
    packsPerUnit: 1,
    totalPacks: '',
    unitPrice: 0,
    shipping: 0,
    store: '秋葉原 A 店',
    status: 'bought',
    reservedAt: '',
    expectedAt: '',
    category: kind === 'single' ? 'シングル' : '新弾',
    rarity: '',
    msrpPack: 0,
    msrpBox: null,
    packsPerBox: 30,
  };
}

export function draftFromCard({ name, price, store, rarity = '' }) {
  blankDraft('single');
  shop.draft.name = name;
  shop.draft.unitPrice = price;
  shop.draft.store = store;
  shop.draft.rarity = rarity;
}

// 商品（全発売日 + 過去の購入履歴の商品名）を選択肢にする
export function productOptions() {
  const map = new Map();
  for (const r of releases) {
    map.set(r.name, {
      name: r.name,
      msrpPack: r.msrpPack ?? 0,
      msrpBox: r.msrpBox ?? null,
      packsPerBox: r.packsPerBox ?? null,
      expectedAt: r.date,
    });
  }
  for (const e of shop.entries) {
    if (e.itemType !== 'sealed' || !e.name || map.has(e.name)) continue;
    map.set(e.name, {
      name: e.name,
      msrpPack: e.unit === 'pack' ? e.unitPrice : e.unitPrice / (e.packsPerUnit || 1),
      msrpBox: e.unit === 'box' ? e.unitPrice : null,
      packsPerBox: e.packsPerUnit || null,
      expectedAt: e.expectedAt || '',
    });
  }
  return [...map.values()];
}

export function selectProduct(product) {
  const d = shop.draft;
  if (!d) return;
  d.itemType = 'sealed';
  d.name = product.name;
  d.productKey = product.name;
  d.msrpPack = product.msrpPack || 0;
  d.msrpBox = product.msrpBox ?? null;
  d.packsPerBox = product.packsPerBox || 30;
  d.expectedAt = product.expectedAt || '';
  d.category = '新弾';
  if (!d.packs || Number(d.packs) <= 0) d.packs = d.packsPerBox;
  recalcSealed();
}

// 購入パック数から BOX / パックを導出（1BOX 分に一致したら BOX）
export function recalcSealed() {
  const d = shop.draft;
  if (!d || d.itemType !== 'sealed') return;
  const packs = Math.max(0, Number(d.packs) || 0);
  const pb = Number(d.packsPerBox) || 30;
  if (packs > 0 && d.msrpBox && pb > 0 && packs % pb === 0) {
    d.unit = 'box';
    d.qty = packs / pb;
    d.packsPerUnit = pb;
    d.unitPrice = d.msrpBox;
  } else {
    d.unit = 'pack';
    d.qty = packs;
    d.packsPerUnit = 1;
    d.unitPrice = d.msrpPack || 0;
  }
  d.totalPacks = packs;
}

export function draftFromRelease(release, unit = 'box') {
  blankDraft('sealed');
  selectProduct({
    name: release.name,
    msrpPack: release.msrpPack ?? 0,
    msrpBox: release.msrpBox ?? null,
    packsPerBox: release.packsPerBox ?? null,
    expectedAt: release.date,
  });
  shop.draft.packs = unit === 'box' ? (release.packsPerBox || 30) : 1;
  recalcSealed();
}

export function draftFromEntry(entry) {
  shop.draft = { ...entry };
}

export function saveDraft() {
  const d = shop.draft;
  if (!d || !d.name.trim()) return false;
  if (d.itemType === 'sealed') recalcSealed();
  const entry = {
    ...d,
    name: d.name.trim(),
    total: d.unitPrice * d.qty + d.shipping,
    date: d.status === 'reserved' ? d.reservedAt || '11/27' : '11/27',
  };
  const i = shop.entries.findIndex((e) => e.id === entry.id);
  if (i >= 0) shop.entries[i] = entry;
  else shop.entries.push(entry);
  shop.draft = null;
  return true;
}

export function openDetail(id) {
  shop.selectedId = id;
}

export function selectedEntry() {
  return shop.entries.find((e) => e.id === shop.selectedId);
}

export function markPurchased(id) {
  const e = shop.entries.find((x) => x.id === id);
  if (!e) return;
  e.status = 'bought';
  e.date = '11/27';
}

export function deleteEntry(id) {
  shop.entries = shop.entries.filter((e) => e.id !== id);
}

export const entryTotal = (e) => e.unitPrice * e.qty + e.shipping;

export function sealedSummary(e) {
  if (e.itemType !== 'sealed') return unitLabel[e.unit] || '';
  if (e.unit === 'box') return `BOX（${e.packsPerUnit || 30}パック）`;
  return `${e.totalPacks || e.qty}パック`;
}

export const wishNames = wishItems.map((w) => w.name);
