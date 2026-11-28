import { db, newId } from '../db/schema';
import type { Store } from '../domain/types';

export async function listStores(includeArchived = false): Promise<Store[]> {
  const rows = await db.stores.filter((s) => !s.deletedAt).toArray();
  const visible = includeArchived ? rows : rows.filter((s) => !s.archivedAt);
  return visible.sort(
    (a, b) =>
      b.favorite - a.favorite ||
      (b.lastVisitedAt ?? 0) - (a.lastVisitedAt ?? 0) ||
      a.name.localeCompare(b.name, 'ja'),
  );
}

export async function upsertStore(input: {
  id?: string;
  name: string;
  shortName?: string;
  kind: 'store' | 'online';
  area?: string;
  url?: string;
  favorite?: boolean;
  memo?: string;
}): Promise<Store> {
  const now = Date.now();
  const name = input.name.trim();
  if (!name) throw new Error('店舗名が空です');
  if (input.id) {
    const existing = await db.stores.get(input.id);
    if (!existing) throw new Error('店舗が見つかりません');
    const next: Store = {
      ...existing,
      name,
      shortName: input.shortName?.trim() || undefined,
      kind: input.kind,
      area: input.area,
      url: input.url,
      favorite: input.favorite ? 1 : 0,
      memo: input.memo,
      updatedAt: now,
    };
    await db.stores.put(next);
    return next;
  }
  const created: Store = {
    id: newId(),
    name,
    shortName: input.shortName?.trim() || undefined,
    kind: input.kind,
    area: input.area,
    url: input.url,
    favorite: input.favorite ? 1 : 0,
    sortOrder: 0,
    memo: input.memo,
    updatedAt: now,
  };
  await db.stores.add(created);
  return created;
}

export async function touchStore(id: string): Promise<void> {
  await db.stores.update(id, { lastVisitedAt: Date.now(), updatedAt: Date.now() });
}

export async function archiveStore(id: string): Promise<void> {
  const now = Date.now();
  await db.stores.update(id, { archivedAt: now, updatedAt: now });
}

export async function restoreStore(id: string): Promise<void> {
  await db.stores.update(id, { archivedAt: undefined, updatedAt: Date.now() });
}
