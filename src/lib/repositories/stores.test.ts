import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/schema';
import { archiveStore, listStores, touchStore, upsertStore } from './stores';

beforeEach(async () => {
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('stores repository', () => {
  it('お気に入り → 最終訪問 → 名前の順で並ぶ', async () => {
    const a = await upsertStore({ name: 'B 店', kind: 'store' });
    const b = await upsertStore({ name: 'A 店', kind: 'store', favorite: true });
    const c = await upsertStore({ name: 'C 店', kind: 'online' });
    await touchStore(a.id);
    await new Promise((r) => setTimeout(r, 2));
    await touchStore(c.id);

    const list = await listStores();
    expect(list.map((s) => s.name)).toEqual(['A 店', 'C 店', 'B 店']);
    expect(list[0].id).toBe(b.id);
  });

  it('アーカイブすると既定の一覧から消える', async () => {
    const s = await upsertStore({ name: 'D 店', kind: 'store' });
    await archiveStore(s.id);
    expect((await listStores()).length).toBe(0);
    expect((await listStores(true)).length).toBe(1);
  });

  it('店舗名を後から変更できる', async () => {
    const s = await upsertStore({
      name: 'カードショップ竜星のPAO 秋葉原ロケット無線店',
      kind: 'store',
    });
    await upsertStore({ id: s.id, name: 'PAO 秋葉原', kind: 'store', favorite: true });
    const [row] = await listStores();
    expect(row.name).toBe('PAO 秋葉原');
    expect(row.favorite).toBe(1);
  });

  it('公式カタログ由来の店舗は正式名を変更できず、別名だけ変えられる', async () => {
    const s = await upsertStore({
      name: 'カードショップ竜星のPAO 秋葉原ロケット無線店',
      kind: 'store',
      source: 'catalog',
      catalogId: 'node/1',
    });
    await upsertStore({
      id: s.id,
      name: '書き換えた名前',
      shortName: 'PAO 秋葉原',
      kind: 'store',
    });
    const [row] = await listStores();
    expect(row.name).toBe('カードショップ竜星のPAO 秋葉原ロケット無線店');
    expect(row.shortName).toBe('PAO 秋葉原');
  });
});
