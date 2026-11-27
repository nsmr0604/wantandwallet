import type { Category, Purchase } from './types';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** "YYYY-MM" の日本時間の月範囲 [start, end) を epoch ms で返す */
export function monthRange(month: string): [number, number] {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error(`invalid month: ${month}`);
  const year = Number(m[1]);
  const mon = Number(m[2]);
  const start = Date.UTC(year, mon - 1, 1) - JST_OFFSET_MS;
  const end = Date.UTC(year, mon, 1) - JST_OFFSET_MS;
  return [start, end];
}

/** epoch ms を日本時間の "YYYY-MM" にする */
export function monthOf(timestamp: number): string {
  const d = new Date(timestamp + JST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function remainingQty(qtyWanted: number, qtyBought: number): number {
  return Math.max(0, qtyWanted - qtyBought);
}

const CATEGORY_KEYS: Record<string, Category> = {
  新弾: 'newset',
  シングル: 'single',
  グッズ: 'goods',
  その他: 'other',
};

export function categoryKey(value: string): Category {
  return CATEGORY_KEYS[value] ?? 'other';
}

export interface BudgetSummary {
  spent: number;
  reserved: number;
  committed: number;
  remaining: number;
  rate: number;
  over: boolean;
}

export function budgetSummary(limit: number, purchases: Purchase[]): BudgetSummary {
  let spent = 0;
  let reserved = 0;
  for (const p of purchases) {
    if (p.deletedAt) continue;
    if (p.status === 'bought') spent += p.total;
    else reserved += p.total;
  }
  const committed = spent + reserved;
  const rate = limit > 0 ? Math.round((committed / limit) * 100) : 0;
  return { spent, reserved, committed, remaining: limit - committed, rate, over: limit - committed < 0 };
}

/** 購入を 1 パックあたりの単価に換算する（BOX はパック数で割る） */
export function effectiveUnitPrice(purchase: Purchase): number {
  if (purchase.unit === 'box' && purchase.packsPerUnit) {
    return purchase.unitPrice / purchase.packsPerUnit;
  }
  return purchase.unitPrice;
}

/** カード種類から並び順のグループを返す */
export function typeGroup(cardType: string | undefined): number {
  if (!cardType) return 5;
  if (/fusion|synchro|xyz|link/i.test(cardType)) return 2;
  if (/monster/i.test(cardType)) return 1;
  if (/spell/i.test(cardType)) return 3;
  if (/trap/i.test(cardType)) return 4;
  return 5;
}

export interface PatrolEntry {
  priority: number;
  order: number;
  name: string;
  nameKana?: string;
  cardType?: string;
}

/** 巡回モードの並び順 */
export function patrolOrder<T extends PatrolEntry>(items: T[], mode: 'priority' | 'typeName'): T[] {
  const collator = new Intl.Collator('ja', { numeric: true });
  return [...items].sort((a, b) => {
    if (mode === 'priority') return a.priority - b.priority || a.order - b.order;
    return (
      typeGroup(a.cardType) - typeGroup(b.cardType) ||
      collator.compare(a.nameKana || a.name, b.nameKana || b.name)
    );
  });
}
