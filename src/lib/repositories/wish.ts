import { db, newId } from '../db/schema';
import type { Card, Priority, WishItem } from '../domain/types';

export interface WishRow extends WishItem {
  card: Card | undefined;
}

export async function listWish(): Promise<WishRow[]> {
  const items = await db.wishItems.filter((w) => !w.deletedAt).toArray();
  const cards = await db.cards.toArray();
  const byId = new Map(cards.map((c) => [c.id, c]));
  return items
    .map((w) => ({ ...w, card: byId.get(w.cardId) }))
    .sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
}

export async function upsertWish(input: {
  cardId: string;
  qtyWanted: number;
  priority: Priority;
  targetPrice?: number;
  rarity?: string;
  memo?: string;
}): Promise<WishItem> {
  const now = Date.now();
  const existing = await db.wishItems
    .filter((w) => !w.deletedAt && w.cardId === input.cardId)
    .first();
  if (existing) {
    const next: WishItem = {
      ...existing,
      qtyWanted: input.qtyWanted,
      priority: input.priority,
      targetPrice: input.targetPrice,
      rarity: input.rarity,
      memo: input.memo,
      updatedAt: now,
    };
    await db.wishItems.put(next);
    return next;
  }
  const created: WishItem = {
    id: newId(),
    cardId: input.cardId,
    qtyWanted: input.qtyWanted,
    priority: input.priority,
    targetPrice: input.targetPrice,
    rarity: input.rarity,
    memo: input.memo,
    createdAt: now,
    updatedAt: now,
  };
  await db.wishItems.add(created);
  return created;
}

export async function removeWish(id: string): Promise<void> {
  const now = Date.now();
  await db.wishItems.update(id, { deletedAt: now, updatedAt: now });
}
