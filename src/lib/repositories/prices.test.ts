import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, newId } from '../db/schema';
import { addPrice, groupByStore, latestAll, latestPrices } from './prices';
import type { PriceObservation } from '../domain/types';

let cardId = '';
let storeA = '';
let storeB = '';

beforeEach(async () => {
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  cardId = newId();
  storeA = newId();
  storeB = newId();
});

const add = (over: Partial<Parameters<typeof addPrice>[0]>) =>
  addPrice({ cardId, storeId: storeA, price: 1000, ...over });

describe('prices repository', () => {
  it('同じ カード×店舗×レアリティ は最新 1 件に集約される', async () => {
    await add({ price: 1000, rarity: 'UR' });
    await new Promise((r) => setTimeout(r, 2));
    await add({ price: 900, rarity: 'UR' });

    const list = await latestPrices(cardId);
    expect(list).toHaveLength(1);
    expect(list[0].price).toBe(900);
  });

  it('同じ店舗でもレアリティが違えば別レコード', async () => {
    await add({ price: 1200, rarity: 'UR' });
    await add({ price: 500, rarity: 'SR' });
    const list = await latestPrices(cardId);
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.rarity).sort()).toEqual(['SR', 'UR']);
  });

  it('店舗ごとの最安順に並ぶ', async () => {
    await add({ storeId: storeA, price: 1200 });
    await add({ storeId: storeB, price: 800 });
    const rows = await latestAll();
    const groups = groupByStore(rows);
    expect(groups[0].storeId).toBe(storeB);
    expect(groups[1].storeId).toBe(storeA);
  });

  it('論理削除は除外する', async () => {
    const row = await add({ price: 1000 });
    await db.priceObservations.update(row.id, { deletedAt: Date.now() });
    const list: PriceObservation[] = await latestPrices(cardId);
    expect(list).toHaveLength(0);
  });
});
