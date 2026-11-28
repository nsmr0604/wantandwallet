import type { Store } from './types';

/** 画面に出す店舗名（短い別名があれば優先） */
export function storeLabel(store: Pick<Store, 'name' | 'shortName'>): string {
  const alias = store.shortName?.trim();
  return alias ? alias : store.name;
}

/** 住所から地図アプリ/サイトを開く URL */
export function mapUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/** 公式データの住所末尾に店名が連結されている場合に取り除く */
export function cleanAddress(address: string, name: string): string {
  const a = address.trim();
  const n = name.trim();
  if (n && a.endsWith(n)) return a.slice(0, -n.length).trim();
  return a;
}
