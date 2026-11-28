import { db, newId } from '../db/schema';
import type { Category, Purchase, PurchaseStatus, Unit } from '../domain/types';

export interface PurchaseInput {
  itemType: 'card' | 'sealed';
  cardId?: string;
  productKey?: string;
  unit: Unit;
  qty: number;
  packsPerUnit?: number;
  totalPacks?: number;
  unitPrice: number;
  shipping?: number;
  rarity?: string;
  status: PurchaseStatus;
  storeId?: string;
  category: Category;
  expectedAt?: string;
  memo?: string;
}

const toEpoch = (date?: string): number | undefined => {
  if (!date) return undefined;
  const t = Date.parse(`${date}T00:00:00+09:00`);
  return Number.isNaN(t) ? undefined : t;
};

export async function addPurchase(input: PurchaseInput): Promise<Purchase> {
  const now = Date.now();
  const qty = Math.max(1, Math.floor(input.qty) || 1);
  const unitPrice = Math.max(0, Math.round(input.unitPrice) || 0);
  const shipping = Math.max(0, Math.round(input.shipping ?? 0) || 0);
  const reserved = input.status === 'reserved';
  const row: Purchase = {
    id: newId(),
    itemType: input.itemType,
    cardId: input.cardId,
    productKey: input.productKey,
    unit: input.unit,
    qty,
    packsPerUnit: input.packsPerUnit,
    totalPacks: input.totalPacks,
    unitPrice,
    shipping,
    total: unitPrice * qty + shipping,
    rarity: input.rarity,
    status: input.status,
    reservedAt: reserved ? now : undefined,
    purchasedAt: reserved ? undefined : now,
    expectedAt: toEpoch(input.expectedAt),
    storeId: input.storeId,
    category: input.category,
    memo: input.memo,
    updatedAt: now,
  };
  await db.purchases.add(row);
  return row;
}

export async function listPurchases(): Promise<Purchase[]> {
  const rows = await db.purchases.filter((p) => !p.deletedAt).toArray();
  return rows.sort((a, b) => (b.purchasedAt ?? b.reservedAt ?? 0) - (a.purchasedAt ?? a.reservedAt ?? 0));
}

export async function markPurchased(id: string): Promise<void> {
  await db.purchases.update(id, { status: 'bought', purchasedAt: Date.now(), updatedAt: Date.now() });
}

export async function deletePurchase(id: string): Promise<void> {
  const now = Date.now();
  await db.purchases.update(id, { deletedAt: now, updatedAt: now });
}

export function totalOf(p: Purchase): number {
  return p.total;
}

/** カードの購入済み枚数（単品・購入済みのみ） */
export async function purchasedQty(cardId: string): Promise<number> {
  const rows = await db.purchases
    .filter((p) => !p.deletedAt && p.itemType === 'card' && p.cardId === cardId)
    .toArray();
  let qty = 0;
  for (const p of rows) {
    if (p.status === 'bought') qty += p.qty;
  }
  return qty;
}
