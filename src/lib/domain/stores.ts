import type { Store } from './types';

/** 画面に出す店舗名（短い別名があれば優先） */
export function storeLabel(store: Pick<Store, 'name' | 'shortName'>): string {
  const alias = store.shortName?.trim();
  return alias ? alias : store.name;
}
