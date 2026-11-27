// L1 モック用のサンプルデータ（実データに近い文字列で破綻を確認するためのもの）
export const budget = {
  limit: 10000,
  spent: 3200,
  categories: [
    { key: 'newset', label: '新弾', allocation: 3000, spent: 2080 },
    { key: 'single', label: 'シングル', allocation: 5000, spent: 1120 },
    { key: 'goods', label: 'グッズ', allocation: 1500, spent: 0 },
    { key: 'other', label: 'その他', allocation: 500, spent: 0 },
  ],
};

export const wishItems = [
  {
    id: 1, name: '灰流うらら', code: 'QCCU-JP001', rarity: 'UR',
    wanted: 2, bought: 1, target: 1200, priority: 1,
  },
  {
    id: 2, name: '増殖するG', code: 'QCCU-JP002', rarity: 'SR',
    wanted: 3, bought: 0, target: 900, priority: 1,
  },
  {
    id: 3, name: '墓穴の指名者', code: 'QCCU-JP003', rarity: 'UR',
    wanted: 1, bought: 0, target: 1500, priority: 2,
  },
  {
    id: 4, name: 'エフェクト・ヴェーラー', code: 'QCCU-JP004', rarity: 'R',
    wanted: 2, bought: 2, target: 300, priority: 3,
  },
  {
    id: 5, name: '無限泡影', code: 'QCCU-JP005', rarity: 'SR',
    wanted: 2, bought: 0, target: 800, priority: 2,
  },
];

export const stores = [
  { id: 1, name: '秋葉原 A 店', kind: 'store', favorite: true },
  { id: 2, name: '秋葉原 B 店', kind: 'store', favorite: false },
  { id: 3, name: 'カード通販 C', kind: 'online', favorite: true },
];

export const compareRows = [
  {
    code: 'QCCU-JP001', name: '灰流うらら', rarity: 'UR',
    prices: [
      { store: '秋葉原 A 店', price: 1180, stock: 1 },
      { store: '秋葉原 B 店', price: 1280, stock: 1 },
      { store: 'カード通販 C', price: 1050, stock: 1 },
    ],
  },
  {
    code: 'QCCU-JP002', name: '増殖するG', rarity: 'SR',
    prices: [
      { store: '秋葉原 A 店', price: 980, stock: 1 },
      { store: '秋葉原 B 店', price: 0, stock: 0 },
      { store: 'カード通販 C', price: 890, stock: 2 },
    ],
  },
  {
    code: 'QCCU-JP003', name: '墓穴の指名者', rarity: 'UR',
    prices: [
      { store: '秋葉原 A 店', price: 1680, stock: 1 },
      { store: '秋葉原 B 店', price: 1580, stock: 1 },
      { store: 'カード通販 C', price: 1720, stock: 1 },
    ],
  },
];

export const purchases = [
  { id: 1, date: '11/24', name: '灰流うらら', code: 'QCCU-JP001', rarity: 'UR', qty: 1, unit: 1180, shipping: 0, store: '秋葉原 A 店', category: 'シングル' },
  { id: 2, date: '11/22', name: '増殖するG', code: 'QCCU-JP002', rarity: 'SR', qty: 2, unit: 890, shipping: 200, store: 'カード通販 C', category: 'シングル' },
  { id: 3, date: '11/16', name: 'ブースター 1 箱', code: '—', rarity: '—', qty: 1, unit: 2080, shipping: 0, store: '秋葉原 B 店', category: '新弾' },
];

export const releases = [
  { name: 'QUARTER CENTURY CHRONICLE side:PRIDE', date: '2026-12-19', kind: 'ブースター', days: 22 },
  { name: 'デッキビルドパック 2027 Vol.1', date: '2027-01-23', kind: 'ブースター', days: 57 },
  { name: 'LIMIT OVER COLLECTION -THE 5TH-', date: '2027-02-27', kind: 'ブースター', days: 92 },
  { name: 'ストラクチャーデッキ 2026', date: '2026-11-21', kind: '構造デッキ', days: -6 },
];

export const searchResults = [
  { name: '灰流うらら', codes: ['QCCU-JP001 / UR', 'RC04-JP001 / 25th', 'SD34-JP001 / N'] },
  { name: '灰流うららの代替', codes: ['—'] },
  { name: '灰塵のサンダー・ドラゴン', codes: ['CYHO-JP001 / R'] },
];

export const yen = (n) =>
  n === 0 ? '—' : '¥' + n.toLocaleString('ja-JP');
