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
    unitMode: p.unit === 'box' ? 'box' : 'pack',
    quantity: p.qty,
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
    unitMode: r.unit === 'box' ? 'box' : 'pack',
    quantity: r.qty,
  })),
];

export const shop = $state({
  entries: seed,
  tab: 'all',
  draft: null,
  selectedId: null,
  // 欲しいリスト（モックでは保存しない）
  wish: wishItems.map((w) => ({
    id: `w${w.id}`,
    name: w.name,
    rarity: w.rarity || '',
    wanted: w.wanted,
    target: w.target,
    priority: w.priority,
    memo: '',
    createdAt: w.id,
  })),
  wishFilter: 'all',
  wishSort: 'priority',
  wishEditingId: null,
  // 設定（モックでは保存しない）
  settings: {
    storagePrice: 30,
  },
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
    unitMode: 'pack',
    quantity: 1,
    packs: '',
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
  // BOX 定価が無い商品はパック固定
  if (!d.msrpBox) d.unitMode = 'pack';
  if (!d.quantity || Number(d.quantity) <= 0) d.quantity = 1;
  recalcSealed();
}

// 数量（パック数 or BOX 数）から単位とパック数を導出する
export function recalcSealed() {
  const d = shop.draft;
  if (!d || d.itemType !== 'sealed') return;
  const pb = Number(d.packsPerBox) || 30;
  const n = Math.max(0, Number(d.quantity) || 0);
  if (d.unitMode === 'box' && d.msrpBox) {
    d.unit = 'box';
    d.packsPerUnit = pb;
    d.qty = n;
    d.unitPrice = d.msrpBox;
    d.totalPacks = n * pb;
  } else {
    d.unit = 'pack';
    d.packsPerUnit = 1;
    d.qty = n;
    d.unitPrice = d.msrpPack || 0;
    d.totalPacks = n;
  }
  d.packs = d.totalPacks;
}

export function setSealedMode(mode) {
  const d = shop.draft;
  if (!d) return;
  const pb = Number(d.packsPerBox) || 30;
  const qty = Math.max(0, Number(d.quantity) || 0);
  if (mode === 'box' && d.msrpBox) {
    // パック → BOX は切り捨て（89パック → 2BOX = 60パック）
    d.unitMode = 'box';
    d.quantity = Math.floor(qty / pb);
  } else {
    // BOX → パック は換算（3BOX → 90パック）
    const packs = d.unitMode === 'box' ? qty * pb : qty;
    d.unitMode = 'pack';
    d.quantity = packs;
  }
  recalcSealed();
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
  shop.draft.unitMode = unit === 'box' && release.msrpBox ? 'box' : 'pack';
  shop.draft.quantity = 1;
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

// --- 欲しいリスト ---
export function wishBought(name) {
  return shop.entries
    .filter((e) => e.status === 'bought' && e.itemType === 'card' && e.name === name)
    .reduce((s, e) => s + e.qty, 0);
}

export function wishRemaining(w) {
  return Math.max(0, w.wanted - wishBought(w.name));
}

export function addWish(name) {
  const exists = shop.wish.find((w) => w.name === name);
  if (exists) return exists;
  const item = {
    id: `w${Date.now()}`,
    name,
    rarity: '',
    wanted: 1,
    target: 0,
    priority: 2,
    memo: '',
    createdAt: 99,
  };
  shop.wish.push(item);
  return item;
}

export function updateWish(item) {
  const i = shop.wish.findIndex((w) => w.id === item.id);
  if (i >= 0) shop.wish[i] = { ...item };
  shop.wishEditingId = null;
}

export function removeWish(id) {
  shop.wish = shop.wish.filter((w) => w.id !== id);
  shop.wishEditingId = null;
}

export const entryTotal = (e) => e.unitPrice * e.qty + e.shipping;

export function sealedSummary(e) {
  if (e.itemType !== 'sealed') return unitLabel[e.unit] || '';
  if (e.unit === 'box') return `BOX（${e.packsPerUnit || 30}パック）`;
  return `${e.totalPacks || e.qty}パック`;
}

export const wishNames = wishItems.map((w) => w.name);
