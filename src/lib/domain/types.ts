export type Category = 'newset' | 'single' | 'goods' | 'other';
export type Stock = 0 | 1 | 2;
export type Priority = 1 | 2 | 3;
export type PurchaseStatus = 'reserved' | 'bought';
export type ItemType = 'card' | 'sealed';
export type Unit = 'single' | 'pack' | 'box';
export type PriceSource = 'visit' | 'online' | 'manual';
export type PatrolSort = 'priority' | 'typeName';

export interface Card {
  id: string;
  konamiId?: string;
  passcode?: string;
  nameJa: string;
  nameNorm: string;
  nameKana?: string;
  nameEn?: string;
  cardType?: string;
  text?: string;
  source: 'yaml-yugi' | 'manual';
  updatedAt: number;
  deletedAt?: number;
}

export interface Store {
  id: string;
  name: string;
  /** 表示用の短い別名（未設定なら name を使う） */
  shortName?: string;
  /** catalog = 公式店舗検索から追加（正式名は編集不可） */
  source?: 'catalog' | 'manual';
  catalogId?: string;
  kind: 'store' | 'online';
  area?: string;
  url?: string;
  favorite: number;
  sortOrder: number;
  lastVisitedAt?: number;
  archivedAt?: number;
  memo?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface WishItem {
  id: string;
  cardId: string;
  qtyWanted: number;
  priority: Priority;
  targetPrice?: number;
  rarity?: string;
  memo?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface PriceObservation {
  id: string;
  cardId: string;
  storeId: string;
  price: number;
  rarity?: string;
  stock: Stock;
  observedAt: number;
  source: PriceSource;
  memo?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface Purchase {
  id: string;
  itemType: ItemType;
  cardId?: string;
  releaseId?: string;
  productKey?: string;
  unit: Unit;
  qty: number;
  packsPerUnit?: number;
  totalPacks?: number;
  unitPrice: number;
  shipping: number;
  total: number;
  rarity?: string;
  status: PurchaseStatus;
  reservedAt?: number;
  purchasedAt?: number;
  expectedAt?: number;
  storeId?: string;
  category: Category;
  sourcePriceId?: string;
  memo?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface Budget {
  id: string;
  month: string;
  limit: number;
  note?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface BudgetCategory {
  id: string;
  month: string;
  category: Category;
  allocation: number;
}

export interface SetRelease {
  id: string;
  name: string;
  releaseDate: string;
  kind?: string;
  url?: string;
  msrpPack?: number;
  msrpBox?: number;
  packsPerBox?: number;
  cardsPerPack?: number;
  preorderAt?: string;
  source: 'official' | 'manual';
  importedAt?: number;
  memo?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface Reminder {
  id: string;
  releaseId: string;
  kind: 'preorder' | 'release' | 'custom';
  remindAt: string;
  note?: string;
  doneAt?: number;
  updatedAt: number;
}

export interface Settings {
  id: 'app';
  defaultMonthlyLimit: number;
  defaultPacksPerBox: number;
  reminderLeadDays: number;
  storageUnitPrice: number;
  categoryDefaults: Record<Category, number>;
  lastExportAt?: number;
  installHintDismissed?: boolean;
  patrolSort?: PatrolSort;
  updatedAt: number;
}
