import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, newId } from '../db/schema';
import { listWish, removeWish, upsertWish } from './wish';
import { purchasedQty } from './purchases';
import type { Card, Purchase } from '../domain/types';

async function addCard(name: string): Promise<Card> {
  const card: Card = {
    id: newId(),
    nameJa: name,
    nameNorm: name,
    source: 'manual',
    updatedAt: Date.now(),
  };
  await db.cards.add(card);
  return card;
}

beforeEach(async () => {
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('wish repository', () => {
  it('同じカードは 1 件にまとまり、更新される', async () => {
    const card = await addCard('灰流うらら');
    await upsertWish({ cardId: card.id, qtyWanted: 1, priority: 2 });
    await upsertWish({ cardId: card.id, qtyWanted: 3, priority: 1, targetPrice: 1200 });

    const rows = await listWish();
    expect(rows).toHaveLength(1);
    expect(rows[0].qtyWanted).toBe(3);
    expect(rows[0].priority).toBe(1);
    expect(rows[0].targetPrice).toBe(1200);
    expect(rows[0].card?.nameJa).toBe('灰流うらら');
  });

  it('削除は論理削除で一覧から消える', async () => {
    const card = await addCard('増殖するG');
    const item = await upsertWish({ cardId: card.id, qtyWanted: 1, priority: 2 });
    await removeWish(item.id);
    expect(await listWish()).toHaveLength(0);
    expect(await db.wishItems.get(item.id)).toBeTruthy();
  });
});

describe('purchasedQty', () => {
  it('購入済みの単品だけを数える', async () => {
    const card = await addCard('墓穴の指名者');
    const base: Omit<Purchase, 'id' | 'status' | 'qty' | 'total'> = {
      itemType: 'card',
      cardId: card.id,
      unit: 'single',
      unitPrice: 1000,
      shipping: 0,
      category: 'single',
      updatedAt: 0,
    };
    await db.purchases.add({ ...base, id: newId(), status: 'bought', qty: 2, total: 2000 });
    await db.purchases.add({ ...base, id: newId(), status: 'reserved', qty: 5, total: 5000 });

    expect(await purchasedQty(card.id)).toBe(2);
  });
});
