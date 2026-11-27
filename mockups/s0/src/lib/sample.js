// L1 モック用のサンプルデータ（実データに近い文字列で破綻を確認するためのもの）
export const budget = {
  limit: 12000,
  spent: 5240,
  reserved: 5940,
  categories: [
    { key: 'newset', label: '新弾', allocation: 3000, spent: 2080 },
    { key: 'single', label: 'シングル', allocation: 5000, spent: 3160 },
    { key: 'goods', label: 'グッズ', allocation: 2500, spent: 0 },
    { key: 'other', label: 'その他', allocation: 1500, spent: 0 },
  ],
};

export const wishItems = [
  {
    id: 1, name: '灰流うらら', kana: 'はるうらら', group: 'monster',
    typeLabel: 'モンスター（チューナー・効果）', rarity: '', wanted: 2, bought: 1, target: 1200, priority: 1,
  },
  {
    id: 2, name: '増殖するG', kana: 'ぞうしょくするじー', group: 'monster',
    typeLabel: 'モンスター（効果）', rarity: '', wanted: 3, bought: 0, target: 900, priority: 1,
  },
  {
    id: 3, name: '墓穴の指名者', kana: 'はかあなのしめいしゃ', group: 'trap',
    typeLabel: '罠カード（通常）', rarity: 'UR 希望', wanted: 1, bought: 0, target: 1500, priority: 2,
  },
  {
    id: 4, name: 'エフェクト・ヴェーラー', kana: 'えふぇくとゔぇーらー', group: 'monster',
    typeLabel: 'モンスター（チューナー・効果）', rarity: '', wanted: 2, bought: 2, target: 300, priority: 3,
  },
  {
    id: 5, name: '無限泡影', kana: 'むげんほうえい', group: 'trap',
    typeLabel: '罠カード（通常）', rarity: '', wanted: 2, bought: 0, target: 800, priority: 2,
  },
  {
    id: 6, name: 'ハーピィの羽根帚', kana: 'はーぴぃのはねぼうき', group: 'spell',
    typeLabel: '魔法カード（通常）', rarity: '', wanted: 1, bought: 0, target: 400, priority: 2,
  },
  {
    id: 7, name: 'アクセスコード・トーカー', kana: 'あくせすこーどとーかー', group: 'extra',
    typeLabel: 'モンスター（リンク）', rarity: '', wanted: 1, bought: 0, target: 1800, priority: 1,
  },
];

export const stores = [
  { id: 1, name: '秋葉原 A 店', kind: 'store', favorite: true, lastVisited: 5 },
  { id: 2, name: '秋葉原 B 店', kind: 'store', favorite: false, lastVisited: 4 },
  { id: 3, name: 'カード通販 C', kind: 'online', favorite: true, lastVisited: 2 },
  { id: 4, name: '池袋 D 店', kind: 'store', favorite: false, lastVisited: 3 },
  { id: 5, name: '新宿 E 店', kind: 'store', favorite: false, lastVisited: 1 },
];

export const compareRows = [
  {
    name: '灰流うらら',
    prices: [
      { store: '秋葉原 A 店', price: 1180, rarity: 'UR', stock: 1 },
      { store: '秋葉原 B 店', price: 1280, rarity: 'UR', stock: 1 },
      { store: 'カード通販 C', price: 1050, rarity: 'UR', stock: 1 },
    ],
  },
  {
    name: '増殖するG',
    prices: [
      { store: '秋葉原 A 店', price: 980, rarity: 'SR', stock: 1 },
      { store: '秋葉原 B 店', price: 0, rarity: '', stock: 0 },
      { store: 'カード通販 C', price: 890, rarity: 'SR', stock: 1 },
    ],
  },
  {
    name: '墓穴の指名者',
    prices: [
      { store: '秋葉原 A 店', price: 1680, rarity: 'UR', stock: 1 },
      { store: '秋葉原 B 店', price: 1580, rarity: 'UR', stock: 1 },
      { store: 'カード通販 C', price: 1720, rarity: '', stock: 1 },
    ],
  },
];

export const purchases = [
  {
    id: 1, date: '11/24', name: '灰流うらら', rarity: 'UR', unit: 'single',
    qty: 1, unitPrice: 1180, shipping: 0, store: '秋葉原 A 店', category: 'シングル', status: 'bought',
  },
  {
    id: 2, date: '11/22', name: '増殖するG', rarity: 'SR', unit: 'single',
    qty: 2, unitPrice: 890, shipping: 200, store: 'カード通販 C', category: 'シングル', status: 'bought',
  },
  {
    id: 3, date: '11/16', name: 'ブースター 1BOX', rarity: '', unit: 'box',
    qty: 1, unitPrice: 2080, shipping: 0, store: '秋葉原 B 店', category: '新弾', status: 'bought',
  },
];

export const reservations = [
  {
    id: 1, name: 'PRIDE AND SOUL', unit: 'box', qty: 1, unitPrice: 5940,
    store: '秋葉原 A 店', reservedAt: '11/14', expectedAt: '2027-01-23', status: 'reserved', category: '新弾',
  },
];

export const releases = [
  {
    name: 'QUARTER CENTURY CHRONICLE side:PRIDE', date: '2026-12-19', kind: 'ブースター',
    days: 22, msrpPack: 198, msrpBox: 5940, packsPerBox: 30, cardsPerPack: 5, preorderAt: '2026-11-14',
  },
  {
    name: 'PRIDE AND SOUL', date: '2027-01-23', kind: 'ブースター',
    days: 57, msrpPack: 198, msrpBox: 5940, packsPerBox: 30, cardsPerPack: 5, preorderAt: '2026-12-19',
  },
  {
    name: 'LIMIT OVER COLLECTION -THE 5TH-', date: '2027-02-27', kind: 'スペシャルパック',
    days: 92, msrpPack: 396, msrpBox: null, packsPerBox: 10, cardsPerPack: 5, preorderAt: null,
  },
  {
    name: 'ストラクチャーデッキ 2026', date: '2026-11-21', kind: '構造デッキ',
    days: -6, msrpPack: null, msrpBox: 2530, packsPerBox: null, cardsPerPack: null, preorderAt: null,
  },
];

export const searchResults = [
  { name: '灰流うらら', type: 'モンスター・チューナー / 効果' },
  { name: '灰流うららの代替', type: 'モンスター / 効果' },
  { name: '灰塵のサンダー・ドラゴン', type: 'モンスター / 効果' },
];

export const yen = (n) => (n === 0 ? '—' : '¥' + n.toLocaleString('ja-JP'));
export const money = (n) => (n < 0 ? '-¥' : '¥') + Math.abs(n).toLocaleString('ja-JP');
