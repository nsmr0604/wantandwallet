import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, newId } from '../db/schema';
import { addPurchase, deletePurchase, listPurchases, markPurchased, purchasedQty } from './purchases';

beforeEach(async () => {
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('purchases repository', () => {
  it('合計 = 単価×数量 + 送料', async () => {
    const row = await addPurchase({
      itemType: 'card',
      unit: 'single',
      qty: 2,
      unitPrice: 890,
      shipping: 200,
      status: 'bought',
      category: 'single',
    });
    expect(row.total).toBe(1980);
    expect((await listPurchases())[0].total).toBe(1980);
  });

  it('予約は購入済み枚数に数えない', async () => {
    const cardId = newId();
    await addPurchase({
      itemType: 'card',
      cardId,
      unit: 'single',
      qty: 2,
      unitPrice: 1000,
      status: 'bought',
      category: 'single',
    });
    await addPurchase({
      itemType: 'card',
      cardId,
      unit: 'single',
      qty: 5,
      unitPrice: 1000,
      status: 'reserved',
      category: 'single',
    });
    expect(await purchasedQty(cardId)).toBe(2);
  });

  it('予約を購入済みにできる', async () => {
    const row = await addPurchase({
      itemType: 'sealed',
      productKey: 'PRIDE AND SOUL',
      unit: 'box',
      qty: 1,
      packsPerUnit: 30,
      totalPacks: 30,
      unitPrice: 5940,
      status: 'reserved',
      category: 'newset',
      expectedAt: '2027-01-23',
    });
    expect(row.purchasedAt).toBeUndefined();
    await markPurchased(row.id);
    const [after] = await listPurchases();
    expect(after.status).toBe('bought');
    expect(after.purchasedAt).toBeTypeOf('number');
  });

  it('削除は論理削除', async () => {
    const row = await addPurchase({
      itemType: 'card',
      unit: 'single',
      qty: 1,
      unitPrice: 500,
      status: 'bought',
      category: 'single',
    });
    await deletePurchase(row.id);
    expect(await listPurchases()).toHaveLength(0);
    expect(await db.purchases.get(row.id)).toBeTruthy();
  });
});
