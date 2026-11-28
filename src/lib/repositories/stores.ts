import { db, newId } from '../db/schema';
import type { Store } from '../domain/types';
import { cleanAddress } from '../domain/stores';

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
  source?: 'catalog' | 'manual';
  catalogId?: string;
  kind: 'store' | 'online';
  area?: string;
  address?: string;
  favorite?: boolean;
  memo?: string;
}): Promise<Store> {
  const now = Date.now();
  const name = input.name.trim();
  if (!name) throw new Error('店舗名が空です');
  if (input.id) {
    const existing = await db.stores.get(input.id);
    if (!existing) throw new Error('店舗が見つかりません');
    const locked = existing.source === 'catalog';
    const next: Store = {
      ...existing,
      // 公式店舗の正式名は変更しない
      name: locked ? existing.name : name,
      shortName: input.shortName?.trim() || undefined,
      source: existing.source ?? input.source,
      catalogId: existing.catalogId ?? input.catalogId,
      kind: input.kind,
      area: input.area,
      address: input.address?.trim() || undefined,
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
    source: input.source ?? 'manual',
    catalogId: input.catalogId,
    kind: input.kind,
    area: input.area,
    address: input.address?.trim() || undefined,
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

/** 既存の店舗が公式カタログの店舗と一致したら、出典と住所を取り込む */
export async function applyCatalogStore(
  id: string,
  catalogId: string,
  address?: string,
): Promise<void> {
  const s = await db.stores.get(id);
  if (!s) return;
  const cleaned = address ? cleanAddress(address, s.name) : '';
  const patch: Partial<Store> = { updatedAt: Date.now() };
  if (!s.source) {
    patch.source = 'catalog';
    patch.catalogId = catalogId;
  }
  if (cleaned && s.address !== cleaned) patch.address = cleaned;
  // 以前は住所をメモに入れていたため、重複を解消する
  if (cleaned && s.memo === address) patch.memo = '';
  await db.stores.update(id, patch);
}
