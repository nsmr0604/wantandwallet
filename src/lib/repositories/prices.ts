import { db, newId } from '../db/schema';
import type { PriceObservation, Stock } from '../domain/types';

export async function addPrice(input: {
  cardId: string;
  storeId: string;
  price: number;
  rarity?: string;
  stock?: Stock;
  source?: PriceObservation['source'];
  memo?: string;
}): Promise<PriceObservation> {
  const now = Date.now();
  const row: PriceObservation = {
    id: newId(),
    cardId: input.cardId,
    storeId: input.storeId,
    price: Math.max(0, Math.round(input.price)),
    rarity: input.rarity || '',
    stock: input.stock ?? 2,
    observedAt: now,
    source: input.source ?? 'visit',
    memo: input.memo,
    updatedAt: now,
  };
  await db.priceObservations.add(row);
  return row;
}

/** カード × 店舗 × レアリティごとの最新価格 */
export async function latestPrices(cardId: string): Promise<PriceObservation[]> {
  const rows = await db.priceObservations
    .filter((p) => !p.deletedAt && p.cardId === cardId)
    .toArray();
  const map = new Map<string, PriceObservation>();
  for (const p of rows) {
    const key = `${p.storeId}|${p.rarity ?? ''}`;
    const prev = map.get(key);
    if (!prev || p.observedAt >= prev.observedAt) map.set(key, p);
  }
  return [...map.values()];
}

/** 全カードの最新価格（比較画面用） */
export async function latestAll(): Promise<PriceObservation[]> {
  const rows = await db.priceObservations.filter((p) => !p.deletedAt).toArray();
  const map = new Map<string, PriceObservation>();
  for (const p of rows) {
    const key = `${p.cardId}|${p.storeId}|${p.rarity ?? ''}`;
    const prev = map.get(key);
    if (!prev || p.observedAt >= prev.observedAt) map.set(key, p);
  }
  return [...map.values()];
}

export interface StorePriceGroup {
  storeId: string;
  list: PriceObservation[];
  cheapest: PriceObservation;
}

/** カード → 店舗 → レアリティ（店舗は最安順） */
export function groupByStore(rows: PriceObservation[]): StorePriceGroup[] {
  const map = new Map<string, PriceObservation[]>();
  for (const p of rows) {
    if (!map.has(p.storeId)) map.set(p.storeId, []);
    map.get(p.storeId)!.push(p);
  }
  return [...map.entries()]
    .map(([storeId, list]) => {
      const sorted = [...list].sort((a, b) => a.price - b.price);
      return { storeId, list: sorted, cheapest: sorted[0] };
    })
    .sort((a, b) => a.cheapest.price - b.cheapest.price);
}

export interface CardPriceGroup {
  cardId: string;
  list: PriceObservation[];
  cheapest: PriceObservation;
}

/** 店舗 → カード → レアリティ（カードは最安順） */
export function groupByCard(rows: PriceObservation[]): CardPriceGroup[] {
  const map = new Map<string, PriceObservation[]>();
  for (const p of rows) {
    if (!map.has(p.cardId)) map.set(p.cardId, []);
    map.get(p.cardId)!.push(p);
  }
  return [...map.entries()]
    .map(([cardId, list]) => {
      const sorted = [...list].sort((a, b) => a.price - b.price);
      return { cardId, list: sorted, cheapest: sorted[0] };
    })
    .sort((a, b) => a.cheapest.price - b.cheapest.price);
}
